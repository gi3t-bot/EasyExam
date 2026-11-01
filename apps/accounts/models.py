"""
apps/accounts/models.py

Custom User model for EasyExam.

WHY AbstractUser and not AbstractBaseUser?
- AbstractUser gives us all of Django's built-in fields (username, email,
  first_name, last_name, is_staff, is_active, date_joined, etc.) for free.
- AbstractBaseUser is lower-level; use it only when you need a fundamentally
  different authentication scheme (e.g., phone-only auth). We don't need that.
- Subclassing AbstractUser lets us add fields later without touching auth internals.

Fields added beyond AbstractUser defaults:
- phone_number     : For OTP-based login (future), or Razorpay order metadata
- exam_preferences : JSONField — which exams the user is preparing for.
                     Stored as JSON so adding new exam types requires no migration.
                     Future "recommendation engine" reads this field.
                     Example: {"primary": "SSC CGL", "others": ["IBPS PO"]}
- avatar           : Profile picture (optional)
- created_at       : Explicit timestamp (AbstractUser has date_joined but we
                     alias it here for clarity in queries)

Fields intentionally NOT added yet (out of scope for v1):
- preferred_language: would support multi-language UI
- study_plan       : would support personalized study plans
- referral_code    : would support referral/affiliate system
These can be added as simple ALTER TABLE ADD COLUMN migrations later.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """
    Extended User model for EasyExam.

    Use this model everywhere instead of auth.User.
    Reference it as: from django.contrib.auth import get_user_model; User = get_user_model()
    """

    # Phone number — optional for now, required when OTP auth is added
    phone_number = models.CharField(
        max_length=10,
        blank=False,
        default="",
        help_text="Mobile number with country code, e.g. +919876543210",
    )

    clerk_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        help_text="Clerk User Id",
    )

    # Which competitive exams is this user preparing for?
    # JSONField avoids a many-to-many table for a simple preference bag.
    # Example value: {"primary": "SSC CGL", "others": ["IBPS PO", "RRB NTPC"]}
    exam_preferences = models.JSONField(
        default=dict,
        blank=True,
        help_text="JSON bag of exam preferences; feeds future recommendation engine",
    )

    # Profile avatar — stored in S3 in prod, locally in dev
    avatar = models.ImageField(
        upload_to="avatars/%Y/%m/",
        null=True,
        blank=True,
        help_text="Optional profile picture",
    )

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        # Index email for fast lookups (login, Razorpay customer matching)
        indexes = [
            models.Index(fields=["email"], name="accounts_user_email_idx"),
        ]

    def __str__(self):
        return self.email or self.username

    @property
    def full_name(self):
        """Returns first + last name, falls back to username."""
        return self.get_full_name() or self.username
