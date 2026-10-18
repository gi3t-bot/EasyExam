"""
apps/accounts/admin.py

Registers CustomUser with the Django admin using UserAdmin,
which gives us the standard Django user management UI (password change form,
permission groups, etc.) plus our custom fields.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """
    Admin interface for CustomUser.

    Extends the default UserAdmin to surface our additional fields
    (phone_number, exam_preferences, avatar) in the detail view.
    """

    # Columns shown in the list view
    list_display = (
        "username",
        "email",
        "phone_number",
        "first_name",
        "last_name",
        "is_staff",
        "is_active",
        "date_joined",
    )

    list_filter = ("is_staff", "is_superuser", "is_active", "date_joined")

    search_fields = ("username", "email", "phone_number", "first_name", "last_name")

    ordering = ("-date_joined",)

    # Add our custom fields to the fieldsets shown in the user edit view.
    # We append a new "EasyExam Profile" section after the standard sections.
    fieldsets = UserAdmin.fieldsets + (
        (
            _("EasyExam Profile"),
            {
                "fields": ("phone_number", "exam_preferences", "avatar"),
                "classes": ("collapse",),  # collapsed by default to keep UI clean
            },
        ),
    )

    # Fields shown when creating a new user via admin
    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            _("EasyExam Profile"),
            {
                "fields": ("email", "phone_number"),
            },
        ),
    )
