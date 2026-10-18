from celery import shared_task
from .utils import send_otp_via_email


@shared_task
def send_otp_task(email: str, otp: str):
    send_otp_via_email(email, otp)
    