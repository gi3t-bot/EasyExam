"""
config/__init__.py

Importing the Celery app here ensures it is loaded when Django starts,
so that @shared_task decorators in any app work correctly.
See: https://docs.celeryq.dev/en/stable/django/first-steps-with-django.html
"""
from .celery import app as celery_app

__all__ = ("celery_app",)
