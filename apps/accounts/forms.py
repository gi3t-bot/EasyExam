"""
apps/accounts/forms.py

Authentication and user account forms...
"""

from django import forms
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.forms import AuthenticationForm
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class UserLoginForm(AuthenticationForm):
    """
    Enhanced login form that accepts either username or email address,
    styled cleanly with modern form input classes.
    """

    error_messages = {
        "invalid_login": _("Invalid username/email or password. Please try again."),
        "inactive": _("This account has been deactivated."),
    }

    username = forms.CharField(
        label=_("Username or Email"),
        widget=forms.TextInput(
            attrs={
                "class": "form-input",
                "placeholder": "student@example.com or username",
                "autocomplete": "username",
                "id": "id_username",
                "autofocus": True,
            }
        ),
    )

    password = forms.CharField(
        label=_("Password"),
        strip=False,
        widget=forms.PasswordInput(
            attrs={
                "class": "form-input",
                "placeholder": "Enter your password",
                "autocomplete": "current-password",
                "id": "id_password",
            }
        ),
    )

    remember_me = forms.BooleanField(
        required=False,
        initial=True,
        label=_("Remember me"),
        widget=forms.CheckboxInput(
            attrs={
                "class": "form-checkbox",
                "id": "id_remember_me",
            }
        ),
    )

    def clean(self):
        username = self.cleaned_data.get("username")
        password = self.cleaned_data.get("password")
        if username and password:
            auth_username = (
                getattr(User.objects.filter(email__iexact=username).first(), "username", username)
                if "@" in username
                else username
            )
            self.user_cache = authenticate(
                self.request, username=auth_username, password=password
            )
            if self.user_cache is None:
                raise self.get_invalid_login_error()
            self.confirm_login_allowed(self.user_cache)

        return self.cleaned_data




class UserRegisterForm(forms.ModelForm):
    """
    Form for new student registration, collecting name, username, email,
    phone number, target exam preference, and password.
    """

    full_name = forms.CharField(
        label=_("Full Name"),
        max_length=150,
        widget=forms.TextInput(
            attrs={
                "class": "form-input",
                "placeholder": "e.g. Rahul Sharma",
                "autocomplete": "name",
                "id": "id_reg_full_name",
            }
        ),
    )

    email = forms.EmailField(
        label=_("Email Address"),
        widget=forms.EmailInput(
            attrs={
                "class": "form-input",
                "placeholder": "student@example.com",
                "autocomplete": "email",
                "id": "id_reg_email",
            }
        ),
    )

    phone_number = forms.CharField(
        label=_("Phone Number"),
        required=False,
        widget=forms.TextInput(
            attrs={
                "class": "form-input",
                "placeholder": "+91 9876543210 ",
                "autocomplete": "tel",
                "id": "id_reg_phone",
            }
        ),
    )

    target_exam = forms.ChoiceField(
        label=_("Primary Target Exam / Certification"),
        choices=[
            ("NISM Series VIII", "NISM Series VIII: Equity Derivatives"),
            ("NCFM Algo Trading", "NCFM Algorithmic Trading Certification"),
            ("NISM Series XV", "NISM Series XV: Research Analyst"),
            ("Quant Finance & Risk", "Quantitative Finance & Market Risk (CQF / VaR)"),
            ("NISM Series XVI", "NISM Series XVI: Commodity Derivatives"),
            ("NISM Series XXI-A", "NISM Series XXI-A: Portfolio Managers (PMS)"),
            ("Other", "Other Fintech / Trading Certification"),
        ],
        widget=forms.Select(
            attrs={
                "class": "form-input form-select",
                "id": "id_reg_target_exam",
            }
        ),
    )

    password = forms.CharField(
        label=_("Password"),
        strip=False,
        widget=forms.PasswordInput(
            attrs={
                "class": "form-input",
                "placeholder": "At least 6 characters",
                "autocomplete": "new-password",
                "id": "id_reg_password",
            }
        ),
    )

    confirm_password = forms.CharField(
        label=_("Confirm Password"),
        strip=False,
        widget=forms.PasswordInput(
            attrs={
                "class": "form-input",
                "placeholder": "Re-enter your password",
                "autocomplete": "new-password",
                "id": "id_reg_confirm_password",
            }
        ),
    )

    class Meta:
        model = User
        fields = ["username", "email", "phone_number"]
        widgets = {
            "username": forms.TextInput(
                attrs={
                    "class": "form-input",
                    "placeholder": "Choose a username",
                    "autocomplete": "username",
                    "id": "id_reg_username",
                }
            ),
        }

    def clean_email(self):
        email = self.cleaned_data.get("email")
        if email and User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError(
                "An account with this email address already exists."
            )
        return email

    def clean_username(self):
        username = self.cleaned_data.get("username")
        if username and User.objects.filter(username__iexact=username).exists():
            raise forms.ValidationError("This username is already taken.")
        return username

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")

        if password and confirm_password:
            if password != confirm_password:
                self.add_error("confirm_password", "Passwords do not match.")
            elif len(password) < 6:
                self.add_error(
                    "password", "Password must be at least 6 characters long."
                )

        return cleaned_data

