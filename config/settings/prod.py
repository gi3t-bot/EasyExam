"""
config/settings/prod.py

Production settings — overrides base.py for the live environment.

Usage:
    Set DJANGO_SETTINGS_MODULE=config.settings.prod in production env vars.
    wsgi.py and asgi.py default to this module.

Security hardening checklist:
  [x] DEBUG = False
  [x] ALLOWED_HOSTS from env
  [x] SECURE_SSL_REDIRECT
  [x] HSTS enabled
  [x] Secure cookie flags
  [x] S3 for media storage
  [x] SMTP email
"""
from decouple import config, Csv
from .base import *  # noqa: F401, F403


# ── Debug ─────────────────────────────────────────────────────────────────────
DEBUG = False

ALLOWED_HOSTS = config("ALLOWED_HOSTS", cast=Csv())

# ── Security Headers ──────────────────────────────────────────────────────────
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000          # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# ── S3 Storage (media files — PDFs, question images) ─────────────────────────
# django-storages reads AWS_* settings automatically.
# Set these env vars in your production environment / secrets manager.
AWS_ACCESS_KEY_ID = config("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = config("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = config("AWS_STORAGE_BUCKET_NAME")
AWS_S3_REGION_NAME = config("AWS_S3_REGION_NAME", default="ap-south-1")
AWS_S3_ENDPOINT_URL = config("AWS_S3_ENDPOINT_URL", default=None)

# Files are private by default — access via pre-signed URLs in views
AWS_DEFAULT_ACL = "private"
AWS_S3_FILE_OVERWRITE = False           # prevent overwriting existing files
AWS_QUERYSTRING_AUTH = True             # use signed URLs for private access
AWS_QUERYSTRING_EXPIRE = 3600           # signed URL validity: 1 hour

# Override Django's default file storage to use S3
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.ManifestStaticFilesStorage",
    },
}

# ── Email ─────────────────────────────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = config("EMAIL_HOST")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="EasyExam <no-reply@easyexam.in>")

# ── Logging ───────────────────────────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            # Structured JSON logging — easy to ship to Datadog/CloudWatch
            "format": '{"level":"%(levelname)s","time":"%(asctime)s","module":"%(module)s","message":"%(message)s"}',
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
    "loggers": {
        "easyexam": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        # Log payment webhook events at INFO so they're always visible
        "easyexam.payments": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
