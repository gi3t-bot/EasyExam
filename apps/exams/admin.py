"""
apps/exams/admin.py
"""

from django.contrib import admin
from .models import Certification, Topic, MockTest, Question, Choice, TestAttempt, UserAnswer


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ["order", "mock_test", "topic", "question_text_short", "marks", "negative_marks"]
    list_filter = ["mock_test__certification", "mock_test", "topic"]
    search_fields = ["question_text", "explanation"]
    inlines = [ChoiceInline]

    def question_text_short(self, obj):
        return obj.question_text[:70]
    question_text_short.short_description = "Question"


class QuestionInline(admin.TabularInline):
    model = Question
    fields = ["order", "topic", "question_text", "marks", "negative_marks"]
    extra = 0
    show_change_link = True


@admin.register(MockTest)
class MockTestAdmin(admin.ModelAdmin):
    list_display = ["title", "certification", "duration_minutes", "total_marks", "passing_score", "is_free", "is_published"]
    list_filter = ["certification", "is_free", "is_published"]
    search_fields = ["title", "description"]
    inlines = [QuestionInline]


@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    list_display = ["code", "title", "category", "passing_percentage", "duration_minutes", "is_active"]
    list_filter = ["category", "is_active"]
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ["name", "certification", "order"]
    list_filter = ["certification"]


class UserAnswerInline(admin.TabularInline):
    model = UserAnswer
    readonly_fields = ["question", "selected_choice", "is_flagged_for_review", "is_correct", "marks_obtained"]
    extra = 0
    can_delete = False


@admin.register(TestAttempt)
class TestAttemptAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "mock_test", "status", "score", "percentage", "passed", "started_at"]
    list_filter = ["status", "passed", "mock_test__certification"]
    readonly_fields = ["started_at", "completed_at"]
    inlines = [UserAnswerInline]

