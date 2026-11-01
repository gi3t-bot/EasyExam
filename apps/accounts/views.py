"""
apps/accounts/views.py

Authentication, OTP verification, and profile views for EasyExam.
"""

from django.views.generic import TemplateView

CERTIFICATIONS = [
    {
        "id": "nism-8",
        "category": "derivatives",
        "category_label": "Securities & Derivatives",
        "title": "NISM-Series-VIII: Equity Derivatives",
        "subtitle": "Mandatory Certification for Traders, Dealers & Derivatives Brokers",
        "badge": "Annual Regulatory Licensure",
        "validity": "1 Year Validity",
        "questions_count": "100 MCQs",
        "duration": "120 Mins",
        "passing_score": "60%",
        "negative_marking": "-0.25 Marks",
        "mock_tests_count": 12,
        "pyqs_count": 6,
        "rating": "4.9",
        "enrolled_count": "18,400+",
        "is_featured": True,
    },
    {
        "id": "ncfm-algo",
        "category": "quant",
        "category_label": "Algorithmic & Quant Finance",
        "title": "NCFM Algorithmic & High-Frequency Trading",
        "subtitle": "Advanced Quantitative Modeling, Automated Execution & Market Microstructure",
        "badge": "Fintech & Prop Trading",
        "validity": "1 Year Certification",
        "questions_count": "60 Questions",
        "duration": "120 Mins",
        "passing_score": "50%",
        "negative_marking": "-0.25 Marks",
        "mock_tests_count": 8,
        "pyqs_count": 4,
        "rating": "4.8",
        "enrolled_count": "9,250+",
        "is_featured": True,
    },
    {
        "id": "nism-15",
        "category": "research",
        "category_label": "Research Analyst",
        "title": "NISM-Series-XV: Research Analyst Certification",
        "subtitle": "Fundamental Analysis, Valuation Models & SEBI Compliance",
        "badge": "SEBI Mandated",
        "validity": "1 Year Validity",
        "questions_count": "100 MCQs",
        "duration": "120 Mins",
        "passing_score": "60%",
        "negative_marking": "-0.25 Marks",
        "mock_tests_count": 10,
        "pyqs_count": 5,
        "rating": "4.9",
        "enrolled_count": "14,100+",
        "is_featured": False,
    },
    {
        "id": "quant-risk",
        "category": "quant",
        "category_label": "Algorithmic & Quant Finance",
        "title": "Quantitative Finance & Market Risk (CQF / Desk Prep)",
        "subtitle": "Black-Scholes, Greeks, VaR, Monte Carlo & Python Backtesting",
        "badge": "Hedge Fund & Desk Exam",
        "validity": "Annual Assessment",
        "questions_count": "80 Problems",
        "duration": "150 Mins",
        "passing_score": "65%",
        "negative_marking": "-0.33 Marks",
        "mock_tests_count": 6,
        "pyqs_count": 3,
        "rating": "4.9",
        "enrolled_count": "6,800+",
        "is_featured": True,
    },
    {
        "id": "nism-16",
        "category": "derivatives",
        "category_label": "Securities & Derivatives",
        "title": "NISM-Series-XVI: Commodity Derivatives Examination",
        "subtitle": "MCX & NCDEX Contracts, Hedging & Settlement Mechanisms",
        "badge": "Commodities Desk",
        "validity": "1 Year Validity",
        "questions_count": "100 MCQs",
        "duration": "120 Mins",
        "passing_score": "60%",
        "negative_marking": "-0.25 Marks",
        "mock_tests_count": 8,
        "pyqs_count": 4,
        "rating": "4.7",
        "enrolled_count": "7,300+",
        "is_featured": False,
    },
    {
        "id": "nism-21a",
        "category": "portfolio",
        "category_label": "Portfolio Management",
        "title": "NISM-Series-XXI-A: Portfolio Management Services (PMS)",
        "subtitle": "Asset Allocation, Alternative Investments & Wealth Governance",
        "badge": "Fund Management",
        "validity": "1 Year Validity",
        "questions_count": "80 MCQs",
        "duration": "120 Mins",
        "passing_score": "60%",
        "negative_marking": "-0.25 Marks",
        "mock_tests_count": 7,
        "pyqs_count": 4,
        "rating": "4.8",
        "enrolled_count": "5,400+",
        "is_featured": False,
    },
]


class HomePageView(TemplateView):
    """
    Testbook-inspired homepage focused on Fintech, Trading, and Capital Markets certifications.
    """

    template_name = "home.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["certifications"] = CERTIFICATIONS
        return context
