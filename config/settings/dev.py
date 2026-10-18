"""
config/settings/dev.py

Development settings — overrides base.py for local development.

Usage:
    Set DJANGO_SETTINGS_MODULE=config.settings.dev in your .env file.
    This is already the default in manage.py.
"""
from .base import *  # noqa: F401, F403

# ── Debug ─────────────────────────────────────────────────────────────────────
DEBUG = True

# ── Security (relaxed for local dev) ─────────────────────────────────────────
ALLOWED_HOSTS = ["127.0.0.1", "localhost", "0.0.0.0", "testserver"]

# ── Installed Apps (dev-only additions) ───────────────────────────────────────
INSTALLED_APPS += [  # noqa: F405
    "debug_toolbar",
    "django_extensions",
]

# ── Middleware (debug toolbar must be early, after SecurityMiddleware) ─────────
MIDDLEWARE = [
    "debug_toolbar.middleware.DebugToolbarMiddleware",
] + MIDDLEWARE  # noqa: F405

# Debug toolbar only shows for these IPs
INTERNAL_IPS = ["127.0.0.1"]

# ── Email ─────────────────────────────────────────────────────────────────────
# Emails printed to console — no SMTP needed in development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ── Celery (synchronous execution for local development) ──────────────────────
# Execute Celery tasks in-process so you don't need a separate background worker
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# ── Media / Storage ───────────────────────────────────────────────────────────
# In dev, media files are stored locally (no S3 bucket needed).
# DEFAULT_FILE_STORAGE is NOT overridden here — it inherits the Django default
# (FileSystemStorage), which uses MEDIA_ROOT defined in base.py.

# ── Logging ───────────────────────────────────────────────────────────────────
# In development, log SQL queries at DEBUG level so you can see what the ORM
# is generating. Remove or set level to WARNING in prod.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{levelname}] {asctime} {module}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
        },
        "django.db.backends": {
            # Set to "DEBUG" temporarily to see raw SQL queries
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        # EasyExam app logger — use: import logging; logger = logging.getLogger("easyexam")
        "easyexam": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}
