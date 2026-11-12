"""
apps/exams/views.py

API Views for Certifications, Mock Tests, Simulator sessions, and Grading.
"""

from decimal import Decimal
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Certification, MockTest, Question, Choice, TestAttempt, UserAnswer
from .serializers import (
    CertificationListSerializer,
    CertificationDetailSerializer,
    ActiveTestSessionSerializer,
    SubmitTestAttemptSerializer,
    TestAttemptResultSerializer,
)


class CertificationListView(APIView):
    """List all available certification tracks."""
    permission_classes = [AllowAny]

    def get(self, request):
        certifications = Certification.objects.filter(is_active=True).prefetch_related("mock_tests")
        serializer = CertificationListSerializer(certifications, many=True)
        return Response(serializer.data)


class CertificationDetailView(APIView):
    """Retrieve details and mock test list for a given certification slug."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        certification = get_object_or_404(
            Certification.objects.prefetch_related("mock_tests", "topics"),
            slug=slug,
            is_active=True,
        )
        serializer = CertificationDetailSerializer(certification)
        return Response(serializer.data)


class StartMockTestView(APIView):
    """
    Start or resume a mock test attempt.
    Delivers secure test content (questions and choices without exposing answers).
    """
    permission_classes = [AllowAny]  # Allow anonymous or authenticated practice

    def post(self, request, test_id):
        mock_test = get_object_or_404(
            MockTest.objects.prefetch_related("questions__choices", "certification"),
            id=test_id,
            is_published=True,
        )

        user = request.user if request.user.is_authenticated else None

        # Check if an in-progress attempt already exists for this user & test
        attempt = None
        if user:
            attempt = TestAttempt.objects.filter(
                user=user,
                mock_test=mock_test,
                status="in_progress"
            ).order_by("-started_at").first()

        if not attempt:
            attempt = TestAttempt.objects.create(
                user=user,
                mock_test=mock_test,
                status="in_progress",
                total_questions=mock_test.questions.count(),
                started_at=timezone.now(),
            )

        test_data = ActiveTestSessionSerializer(mock_test).data
        return Response({
            "attempt_id": attempt.id,
            "started_at": attempt.started_at,
            "test": test_data,
        }, status=status.HTTP_200_OK)


class SubmitMockTestView(APIView):
    """
    Submits, grades, and records the test attempt applying the official negative marking rules.
    """
    permission_classes = [AllowAny]

    def post(self, request, attempt_id):
        attempt = get_object_or_404(
            TestAttempt.objects.select_related("mock_test", "mock_test__certification"),
            id=attempt_id,
        )

        if attempt.status == "completed":
            # Already completed, return existing results
            serializer = TestAttemptResultSerializer(attempt)
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = SubmitTestAttemptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        time_spent_seconds = data.get("time_spent_seconds", 0)
        submitted_answers = data.get("answers", [])

        # Fetch all questions and choices for this test in memory for fast lookup
        questions = {q.id: q for q in attempt.mock_test.questions.all().prefetch_related("choices")}
        choices_map = {}
        for q in questions.values():
            for c in q.choices.all():
                choices_map[c.id] = c

        # Grading counters
        attempted_count = 0
        correct_count = 0
        incorrect_count = 0
        total_score = Decimal("0.00")

        # Map submitted answers by question_id
        ans_by_q = {a["question_id"]: a for a in submitted_answers}

        user_answer_objects = []

        for q_id, question in questions.items():
            ans_info = ans_by_q.get(q_id)
            selected_choice_id = ans_info.get("selected_choice_id") if ans_info else None
            is_flagged = ans_info.get("is_flagged", False) if ans_info else False

            selected_choice = choices_map.get(selected_choice_id) if selected_choice_id else None
            is_correct = False
            marks_obtained = Decimal("0.00")

            if selected_choice:
                attempted_count += 1
                if selected_choice.is_correct:
                    is_correct = True
                    correct_count += 1
                    marks_obtained = question.marks
                    total_score += question.marks
                else:
                    incorrect_count += 1
                    marks_obtained = -abs(question.negative_marks)
                    total_score -= abs(question.negative_marks)

            user_answer_objects.append(
                UserAnswer(
                    attempt=attempt,
                    question=question,
                    selected_choice=selected_choice,
                    is_flagged_for_review=is_flagged,
                    is_correct=is_correct,
                    marks_obtained=marks_obtained,
                )
            )

        # Bulk create answers
        UserAnswer.objects.bulk_create(user_answer_objects)

        total_questions = len(questions)
        unattempted_count = total_questions - attempted_count
        passing_score = attempt.mock_test.passing_score
        total_marks = attempt.mock_test.total_marks or Decimal("100.00")
        percentage = (total_score / total_marks * 100) if total_marks > 0 else Decimal("0.00")
        passed = total_score >= passing_score

        # Update attempt record
        attempt.status = "completed"
        attempt.completed_at = timezone.now()
        attempt.time_spent_seconds = time_spent_seconds
        attempt.total_questions = total_questions
        attempt.attempted_count = attempted_count
        attempt.correct_count = correct_count
        attempt.incorrect_count = incorrect_count
        attempt.unattempted_count = unattempted_count
        attempt.score = max(Decimal("0.00"), total_score)
        attempt.percentage = max(Decimal("0.00"), round(percentage, 2))
        attempt.passed = passed
        attempt.save()

        result_serializer = TestAttemptResultSerializer(attempt)
        return Response(result_serializer.data, status=status.HTTP_200_OK)


class TestAttemptDetailView(APIView):
    """Retrieve full result & diagnostic review of a completed test attempt."""
    permission_classes = [AllowAny]

    def get(self, request, attempt_id):
        attempt = get_object_or_404(
            TestAttempt.objects.select_related("mock_test", "mock_test__certification").prefetch_related("answers"),
            id=attempt_id,
        )
        serializer = TestAttemptResultSerializer(attempt)
        return Response(serializer.data)


class UserAttemptHistoryView(APIView):
    """Retrieve list of user's past test attempts."""
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response([])

        attempts = TestAttempt.objects.filter(
            user=request.user,
            status="completed"
        ).select_related("mock_test", "mock_test__certification").order_by("-completed_at")[:20]

        data = [
            {
                "id": a.id,
                "mock_test_id": a.mock_test_id,
                "test_title": a.mock_test.title,
                "certification_code": a.mock_test.certification.code,
                "score": float(a.score),
                "percentage": float(a.percentage),
                "passed": a.passed,
                "completed_at": a.completed_at,
                "time_spent_seconds": a.time_spent_seconds,
            }
            for a in attempts
        ]
        return Response(data)

