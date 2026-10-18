"""
apps/accounts/utils.py

Helper utilities for OTP generation and email dispatch.
"""
import logging
import secrets
from django.core.mail import send_mail

logger = logging.getLogger("easyexam")


def generate_otp() -> str:
    """Generates a cryptographically secure 6-digit numeric OTP."""
    return f"{secrets.randbelow(10**6):06d}"


def send_otp_via_email(email: str, otp: str):
    """Dispatches OTP via email using Django's configured EMAIL_BACKEND."""
    subject = "Your EasyExam Verification Code"
    message = (
        f"Hello,\n\n"
        f"Your one-time verification code for EasyExam is: {otp}\n\n"
        f"This code will expire in 5 minutes. Do not share this code with anyone.\n\n"
        f"Best regards,\n"
        f"Team EasyExam"
    )
    send_mail(
        subject=subject,
        message=message,
        from_email=None,
        recipient_list=[email],
        fail_silently=False,
    )
    logger.info("OTP email sent to %s", email)

