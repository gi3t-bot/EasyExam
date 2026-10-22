import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.contrib.auth import get_user_model
from decouple import config
from svix.webhooks import Webhook, WebhookVerificationError

User = get_user_model()

@method_decorator(csrf_exempt, name="dispatch")
class ClerkWebhookView(View):
    def post(self, request, *args, **kwargs):
        # 1. Grab Clerk's secret key from .env
        webhook_secret = config("CLERK_WEBHOOK_SIGNING_SECRET", default="")
        if not webhook_secret:
            return JsonResponse({"error": "Webhook secret not configured"}, status=500)

        # 2. Extract Svix headers from incoming request
        svix_id = request.headers.get("svix-id")
        svix_timestamp = request.headers.get("svix-timestamp")
        svix_signature = request.headers.get("svix-signature")

        if not svix_id or not svix_timestamp or not svix_signature:
            return JsonResponse({"error": "Missing svix verification headers"}, status=400)

        # 3. Verify the signature
        payload = request.body.decode("utf-8")
        headers = {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }

        try:
            wh = Webhook(webhook_secret)
            evt = wh.verify(payload, headers)
        except WebhookVerificationError:
            return JsonResponse({"error": "Invalid signature"}, status=400)

        # 4. Handle user events
        event_type = evt.get("type")
        data = evt.get("data")

        if event_type == "user.created":
            clerk_id = data.get("id")
            
            # Extract primary email safely
            email_addresses = data.get("email_addresses", [])
            primary_email = email_addresses[0].get("email_address") if email_addresses else ""
            
            first_name = data.get("first_name") or ""
            last_name = data.get("last_name") or ""

            # Create the user in Django DB
            User.objects.create(
                username=clerk_id,  # unique fallback username
                email=primary_email,
                first_name=first_name,
                last_name=last_name,
                clerk_id=clerk_id,
            )

        elif event_type == "user.updated":
            clerk_id = data.get("id")
            user = User.objects.filter(clerk_id=clerk_id).first()
            if user:
                user.first_name = data.get("first_name") or user.first_name
                user.last_name = data.get("last_name") or user.last_name
                user.save()

        elif event_type == "user.deleted":
            clerk_id = data.get("id")
            User.objects.filter(clerk_id=clerk_id).delete()

        return JsonResponse({"status": "success"}, status=200)
