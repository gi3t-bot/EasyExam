"""
apps/exams/models.py

Models for Certifications, Mock Tests, Questions, Choices, and Student Attempts.
"""

from django.db import models
from django.conf import settings
from django.utils import timezone


class Certification(models.Model):
    """
    Financial certification track (e.g., NISM Series VIII, NCFM Algorithmic Trading).
    """
    code = models.CharField(max_length=50, unique=True, help_text="e.g. NISM-VIII, NCFM-AT")
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True)
    category = models.CharField(
        max_length=50,
        choices=[
            ("derivatives", "Securities & Derivatives"),
            ("quant", "Algorithmic & Quant Finance"),
            ("research", "Research Analyst"),
            ("portfolio", "Portfolio Management"),
        ],
        default="derivatives",
    )
    subtitle = models.CharField(max_length=255, blank=True)
    badge = models.CharField(max_length=100, default="Official Exam Pattern")
    passing_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=60.00)
    duration_minutes = models.PositiveIntegerField(default=120)
    total_questions = models.PositiveIntegerField(default=100)
    negative_marking = models.DecimalField(max_digits=4, decimal_places=2, default=0.25)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Certification"
        verbose_name_plural = "Certifications"

    def __str__(self):
        return f"{self.code} - {self.title}"


class Topic(models.Model):
    """
    Syllabus module / topic for an exam (e.g. Options Greeks, Risk Management, SEBI Regulations).
    Used for weak-area performance diagnostics.
    """
    certification = models.ForeignKey(Certification, on_delete=models.CASCADE, related_name="topics")
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["certification", "order", "id"]

    def __str__(self):
        return f"{self.certification.code} - {self.name}"


class MockTest(models.Model):
    """
    A specific mock test paper under a certification track.
    """
    certification = models.ForeignKey(Certification, on_delete=models.CASCADE, related_name="mock_tests")
    title = models.CharField(max_length=255, help_text="e.g. Full Mock Test 01 — Official Pattern")
    description = models.TextField(blank=True)
    is_free = models.BooleanField(default=True, help_text="True if available without premium pass")
    duration_minutes = models.PositiveIntegerField(default=120)
    total_marks = models.DecimalField(max_digits=6, decimal_places=2, default=100.00)
    passing_score = models.DecimalField(max_digits=6, decimal_places=2, default=60.00)
    negative_marking = models.DecimalField(max_digits=4, decimal_places=2, default=0.25, help_text="Deduction per incorrect answer")
    order = models.PositiveIntegerField(default=1)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Mock Test"
        verbose_name_plural = "Mock Tests"

    def __str__(self):
        return f"{self.certification.code}: {self.title}"

    @property
    def question_count(self):
        return self.questions.count()


class Question(models.Model):
    """
    Multiple choice question.
    """
    mock_test = models.ForeignKey(MockTest, on_delete=models.CASCADE, related_name="questions")
    topic = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True, blank=True, related_name="questions")
    question_text = models.TextField(help_text="Question text or markdown/formula")
    marks = models.DecimalField(max_digits=4, decimal_places=2, default=1.00)
    negative_marks = models.DecimalField(max_digits=4, decimal_places=2, default=0.25)
    explanation = models.TextField(blank=True, help_text="Explanation and formula breakdown shown upon submission")
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:60]}..."


class Choice(models.Model):
    """
    One of the choices/options for a multiple-choice question.
    """
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="choices")
    choice_text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        prefix = f"[✓] " if self.is_correct else ""
        return f"{prefix}{self.choice_text[:50]}"


class TestAttempt(models.Model):
    """
    A student's attempt at taking a mock test.
    """
    STATUS_CHOICES = [
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("abandoned", "Abandoned"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="test_attempts",
        null=True,
        blank=True
    )
    mock_test = models.ForeignKey(MockTest, on_delete=models.CASCADE, related_name="attempts")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="in_progress")
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_spent_seconds = models.PositiveIntegerField(default=0)

    # Scorecard fields
    total_questions = models.PositiveIntegerField(default=0)
    attempted_count = models.PositiveIntegerField(default=0)
    correct_count = models.PositiveIntegerField(default=0)
    incorrect_count = models.PositiveIntegerField(default=0)
    unattempted_count = models.PositiveIntegerField(default=0)
    score = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    passed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-started_at"]
        verbose_name = "Test Attempt"
        verbose_name_plural = "Test Attempts"

    def __str__(self):
        user_id = self.user.email if self.user else "Anonymous"
        return f"{user_id} - {self.mock_test.title} ({self.status}) - Score: {self.score}"


class UserAnswer(models.Model):
    """
    The student's submitted response for an individual question in an attempt.
    """
    attempt = models.ForeignKey(TestAttempt, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="user_answers")
    selected_choice = models.ForeignKey(Choice, on_delete=models.SET_NULL, null=True, blank=True)
    is_flagged_for_review = models.BooleanField(default=False)
    is_correct = models.BooleanField(default=False)
    marks_obtained = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)

    class Meta:
        unique_together = ("attempt", "question")

    def __str__(self):
        return f"Attempt #{self.attempt_id} - Q{self.question_id}: {'Correct' if self.is_correct else 'Incorrect'}"

