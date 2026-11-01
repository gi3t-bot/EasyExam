"""apps/accounts/authentication.py"""
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions

User = get_user_model()
_jwks_client = None


def _get_jwks_client():
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = jwt.PyJWKClient(settings.CLERK_JWKS_URL)
    return _jwks_client


class ClerkAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return None

        token = header.split(" ", 1)[1].strip()
        try:
            signing_key = _get_jwks_client().get_signing_key_from_jwt(token).key
            claims = jwt.decode(
                token,
                signing_key,
                algorithms=["RS256"],
                options={"verify_aud": False},
                leeway=10,
            )
        except jwt.PyJWTError:
            raise exceptions.AuthenticationFailed("Invalid or expired token.")

        azp = claims.get("azp")
        allowed = getattr(settings, "CLERK_AUTHORIZED_PARTIES", [])
        if azp and allowed and azp not in allowed:
            raise exceptions.AuthenticationFailed("Invalid token origin.")

        clerk_id = claims.get("sub")
        if not clerk_id:
            raise exceptions.AuthenticationFailed("Token has no subject.")

        user, _ = User.objects.get_or_create(
            clerk_id=clerk_id, defaults={"username": clerk_id}
        )
        if not user.is_active:
            raise exceptions.AuthenticationFailed("Account disabled.")
        return (user, claims)

    def authenticate_header(self, request):
        return "Bearer"