"""
apps/accounts/views.py

Authentication, OTP verification, and profile views for EasyExam.
"""

import logging
from django.contrib import messages
from django.contrib.auth import get_user_model, login
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import LoginView, LogoutView
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import TemplateView

from .forms import UserLoginForm, UserRegisterForm
from .tasks import send_otp_task
from .utils import generate_otp, send_otp_via_email

logger = logging.getLogger("easyexam")
User = get_user_model()



def _dispatch_otp(email: str, otp: str):
    try:
        send_otp_task.delay(email, otp)
    except Exception:
        send_otp_via_email(email, otp)


class EasyExamLoginView(LoginView):
    """
    Renders the unified light-themed auth page (Sign In + Create Account tabs)
    and processes user login.
    """

    template_name = "accounts/login.html"
    authentication_form = UserLoginForm
    redirect_authenticated_user = True

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if "register_form" not in context:
            context["register_form"] = UserRegisterForm()
        context["active_tab"] = self.request.GET.get("tab", "login")
        return context

    def form_valid(self, form):
        remember_me = form.cleaned_data.get("remember_me", True)
        if not remember_me:
            # Expire session when browser closes
            self.request.session.set_expiry(0)
        else:
            # 30-day persistent session
            self.request.session.set_expiry(60 * 60 * 24 * 30)

        messages.success(
            self.request,
            f"Welcome back, {form.get_user().full_name}!",
        )
        return super().form_valid(form)


class EasyExamRegisterView(View):
    """
    Validates registration form, generates an OTP, stores pending registration,
    and redirects the user to the OTP verification page.
    """

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect("accounts:dashboard")
        return redirect(f"{reverse_lazy('accounts:login')}?tab=register")

    def post(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect("accounts:dashboard")

        form = UserRegisterForm(request.POST)
        if form.is_valid():
            # Extract cleaned registration data to hold temporarily until OTP is verified
            cleaned = form.cleaned_data
            email = cleaned["email"].lower().strip()

            pending_data = {
                "full_name": cleaned.get("full_name", "").strip(),
                "username": cleaned["username"].strip(),
                "email": email,
                "phone_number": cleaned.get("phone_number", "").strip(),
                "target_exam": cleaned.get("target_exam", "NISM Series VIII"),
                "password": cleaned["password"],
            }
            request.session["pending_registration"] = pending_data

            otp = generate_otp()
            request.session["pending_otp"] = otp

            print(f"\n{'=' * 50}\n [EasyExam OTP] Verification Code for {email}: {otp}\n{'=' * 50}\n", flush=True)
            _dispatch_otp(email, otp)
            return redirect("accounts:verify_otp")

        # Form has errors: re-render with the create account tab active
        login_form = UserLoginForm()
        return render(
            request,
            "accounts/login.html",
            {
                "form": login_form,
                "register_form": form,
                "active_tab": "register",
            },
        )


class VerifyOTPView(View):
    """
    Renders the OTP verification page and verifies the 6-digit code.
    Upon successful verification, creates the user in PostgreSQL and logs them in.
    """

    template_name = "accounts/verify_otp.html"

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect("accounts:dashboard")

        pending = request.session.get("pending_registration")
        if not pending:
            messages.warning(
                request, "No pending registration found. Please register first."
            )
            return redirect("accounts:login")

        return render(request, self.template_name, {"email": pending.get("email")})

    def post(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect("accounts:dashboard")

        pending = request.session.get("pending_registration")
        if not pending:
            messages.warning(
                request, "Session expired. Please start registration again."
            )
            return redirect(f"{reverse_lazy('accounts:login')}?tab=register")

        email = pending.get("email")
        submitted_otp = request.POST.get("otp", "").strip()
        expected_otp = request.session.get("pending_otp")

        if not expected_otp:
            return render(
                request,
                self.template_name,
                {
                    "email": email,
                    "error": "The verification code has expired. Please click Resend OTP.",
                },
            )

        if submitted_otp != expected_otp:
            return render(
                request,
                self.template_name,
                {
                    "email": email,
                    "error": "Invalid verification code. Please check and try again.",
                },
            )

        # ── OTP is valid: Create user in PostgreSQL ───────────────────
        first_name, _, last_name = pending.get("full_name", "").strip().partition(" ")

        user = User.objects.create_user(
            username=pending["username"],
            email=pending["email"],
            password=pending["password"],
            first_name=first_name,
            last_name=last_name,
            phone_number=pending.get("phone_number", ""),
            exam_preferences={
                "primary": pending.get("target_exam", "NISM Series VIII")
            },
        )

        # Clean up session
        request.session.pop("pending_registration", None)
        request.session.pop("pending_otp", None)

        # Authenticate newly created student
        login(request, user)
        messages.success(
            request,
            f"Account verified successfully! Welcome to EasyExam, {user.full_name}.",
        )
        return redirect("accounts:dashboard")


class ResendOTPView(View):
    """
    Regenerates and dispatches a fresh OTP to the pending registrant's email.
    """

    def post(self, request, *args, **kwargs):
        pending = request.session.get("pending_registration")
        if not pending:
            messages.warning(request, "Session expired. Please register again.")
            return redirect(f"{reverse_lazy('accounts:login')}?tab=register")

        email = pending.get("email")
        new_otp = generate_otp()
        request.session["pending_otp"] = new_otp

        print(f"\n{'=' * 50}\n [EasyExam OTP (Resent)] Verification Code for {email}: {new_otp}\n{'=' * 50}\n", flush=True)
        _dispatch_otp(email, new_otp)

        messages.success(request, f"A fresh verification code was sent to {email}.")
        return redirect("accounts:verify_otp")



class EasyExamLogoutView(LogoutView):
    """
    Handles secure logout and redirects back to the login page.
    """

    next_page = reverse_lazy("accounts:login")

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            messages.info(request, "You have been logged out.")
        return super().dispatch(request, *args, **kwargs)


AVAILABLE_EXAMS = [
    {"id": "nism-8", "code": "NISM Series VIII", "name": "NISM Series VIII: Equity Derivatives 2025", "short": "NISM Series VIII 2025"},
    {"id": "ncfm-algo", "code": "NCFM Algo Trading", "name": "NCFM Algorithmic Trading Certification", "short": "NCFM Algo Trading 2025"},
    {"id": "nism-15", "code": "NISM Series XV", "name": "NISM Series XV: Research Analyst", "short": "NISM Series XV 2025"},
    {"id": "quant-risk", "code": "Quant Finance & Risk", "name": "Quantitative Finance, Risk & VaR (CQF)", "short": "Quant Risk & VaR 2025"},
    {"id": "nism-16", "code": "NISM Series XVI", "name": "NISM Series XVI: Commodity Derivatives", "short": "NISM Series XVI 2025"},
    {"id": "nism-21a", "code": "NISM Series XXI-A", "name": "NISM Series XXI-A: Portfolio Management (PMS)", "short": "NISM Series XXI-A"},
]


class DashboardView(LoginRequiredMixin, TemplateView):
    """
    Testbook SuperCoaching-inspired student dashboard for Fintech & Trading certifications.
    """

    template_name = "accounts/dashboard.html"
    login_url = reverse_lazy("accounts:login")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        context["user"] = user
        prefs = getattr(user, "exam_preferences", {})
        context["exam_preferences"] = prefs
        context["available_exams"] = AVAILABLE_EXAMS

        selected_code = self.request.GET.get("exam") or prefs.get("primary", "NISM Series VIII")
        current_exam = next(
            (e for e in AVAILABLE_EXAMS if e["code"].lower() in selected_code.lower() or selected_code.lower() in e["name"].lower()),
            AVAILABLE_EXAMS[0],
        )
        context["current_exam"] = current_exam


        # Test series
        context["test_series"] = [
            {
                "title": f"{current_exam['code']} Official Pattern Full Mock #1",
                "questions": 100,
                "duration": "120 Mins",
                "marks": 100,
                "negative": "0.25",
                "free": True,
            },
            {
                "title": f"{current_exam['code']} Official Pattern Full Mock #2",
                "questions": 100,
                "duration": "120 Mins",
                "marks": 100,
                "negative": "0.25",
                "free": True,
            },
            {
                "title": f"{current_exam['code']} Options Greeks & Pricing Diagnostic Mock",
                "questions": 50,
                "duration": "60 Mins",
                "marks": 50,
                "negative": "0.25",
                "free": False,
            },
            {
                "title": f"{current_exam['code']} Regulatory Framework & SEBI Norms Drill",
                "questions": 40,
                "duration": "45 Mins",
                "marks": 40,
                "negative": "0.25",
                "free": False,
            },
        ]
        return context



CERTIFICATIONS = [
    {
        "id": "nism-8",
        "category": "derivatives",
        "category_label": "Securities & Derivatives",
        "title": "NISM-Series-VIII: Equity Derivatives",
        "subtitle": "Mandatory Certification for Traders, Dealers & Derivatives Brokers",
        "badge": "Annual Regulatory Licensure",
        "validity": "1 Year Validity",
        "questions_count": "100 MCQs",
        "duration": "120 Mins",
        "passing_score": "60%",
        "negative_marking": "-0.25 Marks",
        "mock_tests_count": 12,
        "pyqs_count": 6,
        "rating": "4.9",
        "enrolled_count": "18,400+",
        "is_featured": True,
    },
    {
        "id": "ncfm-algo",
        "category": "quant",
        "category_label": "Algorithmic & Quant Finance",
        "title": "NCFM Algorithmic & High-Frequency Trading",
        "subtitle": "Advanced Quantitative Modeling, Automated Execution & Market Microstructure",
        "badge": "Fintech & Prop Trading",
        "validity": "1 Year Certification",
        "questions_count": "60 Questions",
        "duration": "120 Mins",
        "passing_score": "50%",
        "negative_marking": "-0.25 Marks",
        "mock_tests_count": 8,
        "pyqs_count": 4,
        "rating": "4.8",
        "enrolled_count": "9,250+",
        "is_featured": True,
    },
    {
        "id": "nism-15",
        "category": "research",
        "category_label": "Research Analyst",
        "title": "NISM-Series-XV: Research Analyst Certification",
        "subtitle": "Fundamental Analysis, Valuation Models & SEBI Compliance",
        "badge": "SEBI Mandated",
        "validity": "1 Year Validity",
        "questions_count": "100 MCQs",
        "duration": "120 Mins",
        "passing_score": "60%",
        "negative_marking": "-0.25 Marks",
        "mock_tests_count": 10,
        "pyqs_count": 5,
        "rating": "4.9",
        "enrolled_count": "14,100+",
        "is_featured": False,
    },
    {
        "id": "quant-risk",
        "category": "quant",
        "category_label": "Algorithmic & Quant Finance",
        "title": "Quantitative Finance & Market Risk (CQF / Desk Prep)",
        "subtitle": "Black-Scholes, Greeks, VaR, Monte Carlo & Python Backtesting",
        "badge": "Hedge Fund & Desk Exam",
        "validity": "Annual Assessment",
        "questions_count": "80 Problems",
        "duration": "150 Mins",
        "passing_score": "65%",
        "negative_marking": "-0.33 Marks",
        "mock_tests_count": 6,
        "pyqs_count": 3,
        "rating": "4.9",
        "enrolled_count": "6,800+",
        "is_featured": True,
    },
    {
        "id": "nism-16",
        "category": "derivatives",
        "category_label": "Securities & Derivatives",
        "title": "NISM-Series-XVI: Commodity Derivatives Examination",
        "subtitle": "MCX & NCDEX Contracts, Hedging & Settlement Mechanisms",
        "badge": "Commodities Desk",
        "validity": "1 Year Validity",
        "questions_count": "100 MCQs",
        "duration": "120 Mins",
        "passing_score": "60%",
        "negative_marking": "-0.25 Marks",
        "mock_tests_count": 8,
        "pyqs_count": 4,
        "rating": "4.7",
        "enrolled_count": "7,300+",
        "is_featured": False,
    },
    {
        "id": "nism-21a",
        "category": "portfolio",
        "category_label": "Portfolio Management",
        "title": "NISM-Series-XXI-A: Portfolio Management Services (PMS)",
        "subtitle": "Asset Allocation, Alternative Investments & Wealth Governance",
        "badge": "Fund Management",
        "validity": "1 Year Validity",
        "questions_count": "80 MCQs",
        "duration": "120 Mins",
        "passing_score": "60%",
        "negative_marking": "-0.25 Marks",
        "mock_tests_count": 7,
        "pyqs_count": 4,
        "rating": "4.8",
        "enrolled_count": "5,400+",
        "is_featured": False,
    },
]


class HomePageView(TemplateView):
    """
    Testbook-inspired homepage focused on Fintech, Trading, and Capital Markets certifications.
    """

    template_name = "home.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["certifications"] = CERTIFICATIONS
        return context

