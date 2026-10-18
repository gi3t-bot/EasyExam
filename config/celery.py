"""
config/celery.py

Defines the Celery application for EasyExam.

Key design choices:
- DJANGO_SETTINGS_MODULE is already set before this runs (via manage.py or wsgi)
- autodiscover_tasks() scans each installed app for a tasks.py file
- We use django-celery-results for result backend (stores in DB, easy to query)
- We use django-celery-beat for scheduled tasks (analytics snapshots in Phase 8)
"""
import os

from celery import Celery

# Tell Celery which Django settings to use when it starts standalone
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("easyexam")

# Read Celery config from Django settings, namespaced under CELERY_*
# Example: CELERY_BROKER_URL in settings.py maps to broker_url in Celery
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks.py in every installed Django app
app.autodiscover_tasks()
