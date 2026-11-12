"""
apps/exams/urls.py
"""

from django.urls import path
from .views import (
    CertificationListView,
    CertificationDetailView,
    StartMockTestView,
    SubmitMockTestView,
    TestAttemptDetailView,
    UserAttemptHistoryView,
)

app_name = "exams"

urlpatterns = [
    path("exams/", CertificationListView.as_view(), name="certification-list"),
    path("exams/<slug:slug>/", CertificationDetailView.as_view(), name="certification-detail"),
    path("tests/<int:test_id>/start/", StartMockTestView.as_view(), name="test-start"),
    path("attempts/<int:attempt_id>/submit/", SubmitMockTestView.as_view(), name="attempt-submit"),
    path("attempts/<int:attempt_id>/", TestAttemptDetailView.as_view(), name="attempt-detail"),
    path("attempts/", UserAttemptHistoryView.as_view(), name="attempt-history"),
]

