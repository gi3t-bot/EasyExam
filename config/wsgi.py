"""config/wsgi.py — WSGI entrypoint for production (gunicorn, uwsgi)."""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")

application = get_wsgi_application()
