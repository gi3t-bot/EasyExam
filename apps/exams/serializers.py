"""
apps/exams/serializers.py

Serializers for Exams, Active Test Running, Submission & Results Review.
"""

from rest_framework import serializers
from .models import Certification, MockTest, Topic, Question, Choice, TestAttempt, UserAnswer


# ── Exam & Test Catalog Serializers ───────────────────────────────────

class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ["id", "name", "description"]


class MockTestSummarySerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = MockTest
        fields = [
            "id",
            "title",
            "description",
            "is_free",
            "duration_minutes",
            "total_marks",
            "passing_score",
            "negative_marking",
            "order",
            "question_count",
        ]


class CertificationListSerializer(serializers.ModelSerializer):
    test_count = serializers.SerializerMethodField()

    class Meta:
        model = Certification
        fields = [
            "id",
            "code",
            "title",
            "slug",
            "category",
            "subtitle",
            "badge",
            "passing_percentage",
            "duration_minutes",
            "total_questions",
            "negative_marking",
            "description",
            "test_count",
        ]

    def get_test_count(self, obj):
        return obj.mock_tests.filter(is_published=True).count()


class CertificationDetailSerializer(serializers.ModelSerializer):
    mock_tests = serializers.SerializerMethodField()
    topics = TopicSerializer(many=True, read_only=True)

    class Meta:
        model = Certification
        fields = [
            "id",
            "code",
            "title",
            "slug",
            "category",
            "subtitle",
            "badge",
            "passing_percentage",
            "duration_minutes",
            "total_questions",
            "negative_marking",
            "description",
            "topics",
            "mock_tests",
        ]

    def get_mock_tests(self, obj):
        tests = obj.mock_tests.filter(is_published=True)
        return MockTestSummarySerializer(tests, many=True).data


# ── Active Test Running Serializers (Secure: No answers leaked) ───────

class ActiveExamChoiceSerializer(serializers.ModelSerializer):
    """Secure: Omits is_correct during live exam."""
    class Meta:
        model = Choice
        fields = ["id", "choice_text", "order"]


class ActiveExamQuestionSerializer(serializers.ModelSerializer):
    """Secure: Omits explanation during live exam."""
    choices = ActiveExamChoiceSerializer(many=True, read_only=True)
    topic_name = serializers.CharField(source="topic.name", read_only=True, default="General")

    class Meta:
        model = Question
        fields = [
            "id",
            "order",
            "question_text",
            "marks",
            "negative_marks",
            "topic_name",
            "choices",
        ]


class ActiveTestSessionSerializer(serializers.ModelSerializer):
    """Payload delivered when a student starts or resumes a mock test."""
    questions = serializers.SerializerMethodField()
    certification_code = serializers.CharField(source="certification.code", read_only=True)
    certification_title = serializers.CharField(source="certification.title", read_only=True)

    class Meta:
        model = MockTest
        fields = [
            "id",
            "title",
            "description",
            "duration_minutes",
            "total_marks",
            "passing_score",
            "negative_marking",
            "certification_code",
            "certification_title",
            "questions",
        ]

    def get_questions(self, obj):
        qs = obj.questions.all().prefetch_related("choices")
        return ActiveExamQuestionSerializer(qs, many=True).data


# ── Test Submission Serializers ───────────────────────────────────────

class AnswerSubmissionItem(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_choice_id = serializers.IntegerField(required=False, allow_null=True)
    is_flagged = serializers.BooleanField(default=False)


class SubmitTestAttemptSerializer(serializers.Serializer):
    time_spent_seconds = serializers.IntegerField(min_value=0, default=0)
    answers = AnswerSubmissionItem(many=True)


# ── Test Result & Review Serializers (Full Details & Explanations) ────

class ReviewChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "choice_text", "is_correct", "order"]


class QuestionReviewSerializer(serializers.ModelSerializer):
    choices = ReviewChoiceSerializer(many=True, read_only=True)
    selected_choice_id = serializers.SerializerMethodField()
    is_correct = serializers.SerializerMethodField()
    is_flagged = serializers.SerializerMethodField()
    marks_obtained = serializers.SerializerMethodField()
    topic_name = serializers.CharField(source="topic.name", read_only=True, default="General")

    class Meta:
        model = Question
        fields = [
            "id",
            "order",
            "question_text",
            "marks",
            "negative_marks",
            "explanation",
            "topic_name",
            "choices",
            "selected_choice_id",
            "is_correct",
            "is_flagged",
            "marks_obtained",
        ]

    def _get_user_answer(self, obj):
        # We populate _answers_map in context for high performance
        answers_map = self.context.get("answers_map", {})
        return answers_map.get(obj.id)

    def get_selected_choice_id(self, obj):
        ua = self._get_user_answer(obj)
        return ua.selected_choice_id if ua else None

    def get_is_correct(self, obj):
        ua = self._get_user_answer(obj)
        return ua.is_correct if ua else False

    def get_is_flagged(self, obj):
        ua = self._get_user_answer(obj)
        return ua.is_flagged_for_review if ua else False

    def get_marks_obtained(self, obj):
        ua = self._get_user_answer(obj)
        return float(ua.marks_obtained) if ua else 0.0


class TestAttemptResultSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source="mock_test.title", read_only=True)
    certification_code = serializers.CharField(source="mock_test.certification.code", read_only=True)
    certification_title = serializers.CharField(source="mock_test.certification.title", read_only=True)
    passing_score = serializers.FloatField(source="mock_test.passing_score", read_only=True)
    topic_diagnostics = serializers.SerializerMethodField()
    questions_review = serializers.SerializerMethodField()

    class Meta:
        model = TestAttempt
        fields = [
            "id",
            "mock_test_id",
            "test_title",
            "certification_code",
            "certification_title",
            "status",
            "started_at",
            "completed_at",
            "time_spent_seconds",
            "total_questions",
            "attempted_count",
            "correct_count",
            "incorrect_count",
            "unattempted_count",
            "score",
            "percentage",
            "passing_score",
            "passed",
            "topic_diagnostics",
            "questions_review",
        ]

    def get_topic_diagnostics(self, obj):
        # Calculate topic performance breakdown
        topics = {}
        for ans in obj.answers.select_related("question__topic"):
            t_name = ans.question.topic.name if ans.question.topic else "General"
            if t_name not in topics:
                topics[t_name] = {"topic": t_name, "total": 0, "correct": 0, "incorrect": 0, "score": 0.0}
            topics[t_name]["total"] += 1
            if ans.selected_choice_id:
                if ans.is_correct:
                    topics[t_name]["correct"] += 1
                else:
                    topics[t_name]["incorrect"] += 1
            topics[t_name]["score"] += float(ans.marks_obtained)

        return list(topics.values())

    def get_questions_review(self, obj):
        answers = {ans.question_id: ans for ans in obj.answers.all()}
        questions = obj.mock_test.questions.all().prefetch_related("choices", "topic")
        serializer = QuestionReviewSerializer(
            questions,
            many=True,
            context={"answers_map": answers}
        )
        return serializer.data

