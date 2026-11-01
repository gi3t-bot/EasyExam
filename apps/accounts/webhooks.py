"""apps/accounts/webhooks.py — Clerk -> Django user sync (idempotent)."""

import logging
import json
from decouple import config
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from svix.webhooks import Webhook, WebhookVerificationError

User = get_user_model()
logger = logging.getLogger("easyexam")


def _primary_email(data: dict) -> str:
    emails = data.get("email_addresses") or []
    primary_id = data.get("primary_email_address_id")

    for item in emails:
        if item.get("id") == primary_id:
            return item.get("email_address", "")

    return emails[0].get("email_address", "") if emails else ""


@method_decorator(csrf_exempt, name="dispatch")
class ClerkWebhookView(View):
    http_method_names = ["post"]

    def post(self, request, *args, **kwargs):
        webhook_secret = config("CLERK_WEBHOOK_SIGNING_SECRET", default="")
        if not webhook_secret:
            return JsonResponse({"error": "Webhook secret not configured"}, status=500)

        payload = request.body.decode("utf-8")

        headers = {
            "svix-id": request.headers.get("svix-id", ""),
            "svix-timestamp": request.headers.get("svix-timestamp", ""),
            "svix-signature": request.headers.get("svix-signature", ""),
        }
        if not all(headers.values()):
            return JsonResponse({"error": "Missing svix headers"}, status=400)

        try:
            Webhook(webhook_secret).verify(payload, headers)  # raises if invalid
        except WebhookVerificationError as e:
            logger.warning("Clerk webhook rejected: %s", e)
            return JsonResponse({"error": "Invalid signature"}, status=400)

        evt = json.loads(payload)

        event_type = evt.get("type")
        data = evt.get("data") or {}
        clerk_id = data.get("id")

        if not clerk_id:
            return JsonResponse({"status": "ignored"}, status=200)

        if event_type in ("user.created", "user.updated"):
            user, created = User.objects.get_or_create(
                clerk_id=clerk_id,
                defaults={"username": clerk_id},
            )
            user.email = _primary_email(data) or user.email
            user.first_name = data.get("first_name") or ""
            user.last_name = data.get("last_name") or ""
            if created:
                user.set_unusable_password()
            user.save()

        elif event_type == "user.deleted":
            # Deactivate instead of delete, so attempts and payments stay intact.
            User.objects.filter(clerk_id=clerk_id).update(is_active=False)

        return JsonResponse({"status": "success"}, status=200)