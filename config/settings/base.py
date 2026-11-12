"""
config/settings/base.py

Base settings shared by ALL environments (dev, prod, test).

Rules:
- No secrets here — only structure and defaults
- All sensitive values come from environment variables via decouple
- dev.py and prod.py import this and override only what they need to

Reading order:
  1. This file is imported by dev.py or prod.py
  2. dev.py / prod.py override specific values
  3. DJANGO_SETTINGS_MODULE env var selects which file Django loads
"""

from pathlib import Path
from decouple import config, Csv

# ── Paths ─────────────────────────────────────────────────────────────────────
# BASE_DIR is the repo root (parent of config/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ── Security ──────────────────────────────────────────────────────────────────
SECRET_KEY = config("SECRET_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="127.0.0.1,localhost,.trycloudflare.com", cast=Csv())

# ── Application Definition ────────────────────────────────────────────────────
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "django_celery_results",  # stores Celery task results in DB
    "django_celery_beat",  # periodic task scheduler
    "storages",  # django-storages for S3
]

LOCAL_APPS = [
    "apps.accounts",
    "apps.exams",
    "rest_framework",
    "corsheaders",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ── Middleware ────────────────────────────────────────────────────────────────
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "corsheaders.middleware.CorsMiddleware",
]

# ── URL / WSGI / ASGI ─────────────────────────────────────────────────────────
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ── Templates ─────────────────────────────────────────────────────────────────
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        # Global templates directory at repo root level
        "DIRS": [BASE_DIR / "templates"],
        # Also look for templates inside each app's templates/ folder
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ── Authentication ────────────────────────────────────────────────────────────
# CRITICAL: Must be set before the FIRST migration ever runs.
# Points to our custom user model in apps/accounts/models.py.
# Once set and migrated, do not change this value.
AUTH_USER_MODEL = "accounts.CustomUser"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LOGIN_URL = "accounts:login"
LOGIN_REDIRECT_URL = "accounts:dashboard"
LOGOUT_REDIRECT_URL = "accounts:login"

# ── Database ──────────────────────────────────────────────────────────────────
# PostgreSQL used in ALL environments (no SQLite — see plan for rationale).
# Connection values come from environment variables.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME", default="easyexam"),
        "USER": config("DB_USER", default="postgres"),
        "PASSWORD": config("DB_PASSWORD", default=""),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
        # Keep persistent connections alive to avoid reconnect overhead
        "CONN_MAX_AGE": 60,
    }
}

# ── Cache ─────────────────────────────────────────────────────────────────────
# Redis cache on a separate DB index from the Celery broker
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": config("CACHE_REDIS_URL", default="redis://localhost:6379/1"),
    }
}

# ── Celery ────────────────────────────────────────────────────────────────────
# All Celery settings are namespaced CELERY_* so celery.py picks them up
# via app.config_from_object("django.conf:settings", namespace="CELERY")
CELERY_BROKER_URL = config("REDIS_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = "django-db"  # store results in DB via django-celery-results
CELERY_RESULT_EXTENDED = True  # store task name, args, kwargs in result
CELERY_CACHE_BACKEND = "default"
CELERY_TIMEZONE = "Asia/Kolkata"
CELERY_TASK_TRACK_STARTED = True  # tasks show STARTED state (useful for polling)
CELERY_TASK_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_RESULT_SERIALIZER = "json"

# ── Internationalization ──────────────────────────────────────────────────────
# English-only for v1. Multi-language support is out of scope but the
# setting is here so adding USE_I18N=True later is a one-liner.
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = False  # not building translations in v1
USE_TZ = True  # always store datetimes as UTC in DB, display in IST

# ── Static Files ──────────────────────────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"  # collected here by collectstatic
STATICFILES_DIRS = [BASE_DIR / "static"]  # project-level static files

# ── Media Files ───────────────────────────────────────────────────────────────
# In dev: files stored locally under media/
# In prod: dev.py leaves these as-is; prod.py overrides DEFAULT_FILE_STORAGE to S3
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ── Default Primary Key ───────────────────────────────────────────────────────
# BigAutoField to future-proof against tables with many rows (question banks)
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── Session ───────────────────────────────────────────────────────────────────
SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"
SESSION_COOKIE_AGE = 60 * 60 * 24 * 30  # 30 days


# ── Clerk ──────────────────────────────────────────
CLERK_JWKS_URL = config("CLERK_JWKS_URL")
CLERK_AUTHORIZED_PARTIES = ["http://localhost:5173"]  # where your React app runs

# ── REST API ───────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.accounts.authentication.ClerkAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

# ── CORS (lets React call Django) ──────────────────
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
