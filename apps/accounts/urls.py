"""
apps/accounts/urls.py

URL patterns for accounts authentication and dashboard.
"""
from django.urls import path
from . import views

app_name = "accounts"

urlpatterns = [
    path("login/", views.EasyExamLoginView.as_view(), name="login"),
    path("register/", views.EasyExamRegisterView.as_view(), name="register"),
    path("verify-otp/", views.VerifyOTPView.as_view(), name="verify_otp"),
    path("resend-otp/", views.ResendOTPView.as_view(), name="resend_otp"),
    path("logout/", views.EasyExamLogoutView.as_view(), name="logout"),
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),
]
