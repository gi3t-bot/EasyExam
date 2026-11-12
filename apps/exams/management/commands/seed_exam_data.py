"""
apps/exams/management/commands/seed_exam_data.py

Populates database with official certification tracks, topics, mock tests,
and realistic exam questions with options and explanations.
"""

from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.exams.models import Certification, Topic, MockTest, Question, Choice


class Command(BaseCommand):
    help = "Seeds initial certifications, topics, mock tests, and sample questions."

    def handle(self, *args, **options):
        self.stdout.write("Seeding exam catalog and question banks...")

        # ── 1. Create Certifications ──────────────────────────────────
        certs_data = [
            {
                "code": "NISM-VIII",
                "title": "NISM-Series-VIII: Equity Derivatives Certification Examination",
                "slug": "nism-series-viii-equity-derivatives",
                "category": "derivatives",
                "subtitle": "Mandatory Certification for Traders, Dealers & Derivatives Brokers",
                "badge": "Annual Regulatory Licensure",
                "passing_percentage": Decimal("60.00"),
                "duration_minutes": 120,
                "total_questions": 100,
                "negative_marking": Decimal("0.25"),
                "order": 1,
            },
            {
                "code": "NCFM-AT",
                "title": "NCFM Algorithmic & High-Frequency Trading",
                "slug": "ncfm-algorithmic-trading",
                "category": "quant",
                "subtitle": "Advanced Quantitative Modeling, Automated Execution & Market Microstructure",
                "badge": "Fintech & Prop Trading",
                "passing_percentage": Decimal("50.00"),
                "duration_minutes": 120,
                "total_questions": 60,
                "negative_marking": Decimal("0.25"),
                "order": 2,
            },
            {
                "code": "NISM-XV",
                "title": "NISM-Series-XV: Research Analyst Certification",
                "slug": "nism-series-xv-research-analyst",
                "category": "research",
                "subtitle": "Fundamental Analysis, Valuation Models & SEBI Compliance",
                "badge": "SEBI Mandated",
                "passing_percentage": Decimal("60.00"),
                "duration_minutes": 120,
                "total_questions": 100,
                "negative_marking": Decimal("0.25"),
                "order": 3,
            },
            {
                "code": "QF-RISK",
                "title": "Quantitative Finance & Market Risk (CQF / Desk Prep)",
                "slug": "quantitative-finance-market-risk",
                "category": "quant",
                "subtitle": "Black-Scholes, Greeks, VaR, Monte Carlo & Python Backtesting",
                "badge": "Hedge Fund & Desk Exam",
                "passing_percentage": Decimal("65.00"),
                "duration_minutes": 150,
                "total_questions": 80,
                "negative_marking": Decimal("0.33"),
                "order": 4,
            },
            {
                "code": "NISM-XVI",
                "title": "NISM-Series-XVI: Commodity Derivatives Examination",
                "slug": "nism-series-xvi-commodity-derivatives",
                "category": "derivatives",
                "subtitle": "MCX & NCDEX Contracts, Hedging & Settlement Mechanisms",
                "badge": "Commodities Desk",
                "passing_percentage": Decimal("60.00"),
                "duration_minutes": 120,
                "total_questions": 100,
                "negative_marking": Decimal("0.25"),
                "order": 5,
            },
        ]

        cert_objs = {}
        for cdata in certs_data:
            cert, _ = Certification.objects.update_or_create(code=cdata["code"], defaults=cdata)
            cert_objs[cert.code] = cert

        # ── 2. Create Topics for NISM-VIII ────────────────────────────
        nism8 = cert_objs["NISM-VIII"]
        t_basics, _ = Topic.objects.get_or_create(certification=nism8, name="Basics of Derivatives & Forwards", defaults={"order": 1})
        t_futures, _ = Topic.objects.get_or_create(certification=nism8, name="Futures Pricing & Hedging", defaults={"order": 2})
        t_options, _ = Topic.objects.get_or_create(certification=nism8, name="Options Greeks & Strategies", defaults={"order": 3})
        t_margins, _ = Topic.objects.get_or_create(certification=nism8, name="Clearing, Settlement & SPAN Margins", defaults={"order": 4})
        t_sebi, _ = Topic.objects.get_or_create(certification=nism8, name="Regulatory Framework & SEBI Rules", defaults={"order": 5})

        # ── 3. Create Mock Tests for NISM-VIII ─────────────────────────
        mock_test_1, _ = MockTest.objects.update_or_create(
            certification=nism8,
            title="Full Mock Test 01 — Official Pattern",
            defaults={
                "description": "Comprehensive simulation following the official NISM Series VIII pattern with 0.25 negative marking.",
                "duration_minutes": 120,
                "total_marks": Decimal("100.00"),
                "passing_score": Decimal("60.00"),
                "negative_marking": Decimal("0.25"),
                "is_free": True,
                "order": 1,
            }
        )

        mock_test_2, _ = MockTest.objects.update_or_create(
            certification=nism8,
            title="Full Mock Test 02 — Section-wise Options & Greeks",
            defaults={
                "description": "Deep-dive diagnostic test focused on Option Greeks (Delta, Gamma, Vega, Theta), Put-Call Parity, and synthetic positions.",
                "duration_minutes": 120,
                "total_marks": Decimal("100.00"),
                "passing_score": Decimal("60.00"),
                "negative_marking": Decimal("0.25"),
                "is_free": True,
                "order": 2,
            }
        )

        # ── 4. Create Questions for Mock Test 1 ─────────────────────────
        questions_data = [
            {
                "topic": t_options,
                "text": "Which Option Greek measures the sensitivity of an option's Delta relative to a one-unit change in the price of the underlying asset?",
                "marks": Decimal("1.00"),
                "negative": Decimal("0.25"),
                "explanation": "Gamma (Γ) measures the rate of change in an option's Delta for every $1 / ₹1 move in the underlying asset's price. It is the second derivative of the option price with respect to the underlying price.",
                "choices": [
                    ("Vega", False),
                    ("Gamma", True),
                    ("Theta", False),
                    ("Rho", False),
                ],
            },
            {
                "topic": t_options,
                "text": "According to Put-Call Parity for European options with no dividends, which of the following equations holds true? (Where C = Call, P = Put, S = Spot, K = Strike, r = risk-free rate, T = time to maturity)",
                "marks": Decimal("1.00"),
                "negative": Decimal("0.25"),
                "explanation": "Put-Call Parity states that C + K * e^(-r*T) = P + S. That is, a fiduciary call (Call + present value of strike) equals a protective put (Put + Spot).",
                "choices": [
                    ("C + K * e^(-r*T) = P + S", True),
                    ("C + S = P + K * e^(-r*T)", False),
                    ("C - P = S + K * e^(-r*T)", False),
                    ("C * P = S * K * e^(-r*T)", False),
                ],
            },
            {
                "topic": t_futures,
                "text": "If a stock currently trades at ₹1,500, the annual risk-free rate is 6%, and the time to expiration is 3 months (0.25 years), what is the theoretical Fair Value of the 3-month Futures contract (assuming no dividends and discrete compounding: F = S * (1 + r*T))?",
                "marks": Decimal("1.00"),
                "negative": Decimal("0.25"),
                "explanation": "Using Cost of Carry model: F = S * (1 + r * T) = 1,500 * (1 + 0.06 * 0.25) = 1,500 * (1 + 0.015) = 1,500 * 1.015 = ₹1,522.50.",
                "choices": [
                    ("₹1,509.00", False),
                    ("₹1,522.50", True),
                    ("₹1,590.00", False),
                    ("₹1,477.50", False),
                ],
            },
            {
                "topic": t_options,
                "text": "A trader creates a Long Straddle strategy by simultaneously purchasing an At-The-Money (ATM) Call and an ATM Put with identical strike and expiration. When does this strategy yield maximum profitability?",
                "marks": Decimal("1.00"),
                "negative": Decimal("0.25"),
                "explanation": "A Long Straddle is a long volatility (Vega) strategy. It profits when the underlying asset makes a substantial price movement in either direction (upwards or downwards) exceeding the combined premium paid.",
                "choices": [
                    ("When the underlying asset remains completely range-bound and stationary", False),
                    ("When implied volatility plummets significantly before expiration", False),
                    ("When the underlying asset makes a significant, high-momentum breakout in either direction", True),
                    ("Only when interest rates decline to zero", False),
                ],
            },
            {
                "topic": t_margins,
                "text": "In the Indian equity derivatives market, what system is utilized by clearing corporations to compute real-time portfolio-based margin requirements?",
                "marks": Decimal("1.00"),
                "negative": Decimal("0.25"),
                "explanation": "SPAN (Standard Portfolio Analysis of Risk) margin system, developed by CME and adopted by SEBI/Clearing Corporations, calculates risk based on 16 risk scenarios across price and volatility shifts.",
                "choices": [
                    ("VaR-ONLY System", False),
                    ("SPAN (Standard Portfolio Analysis of Risk)", True),
                    ("Fixed Notional Percentage (FNP)", False),
                    ("Mark-to-Market Auto Settler", False),
                ],
            },
            {
                "topic": t_options,
                "text": "What is the theoretical maximum loss for an investor who writes (sells) an uncovered (naked) Call option?",
                "marks": Decimal("1.00"),
                "negative": Decimal("0.25"),
                "explanation": "Because a stock's price can theoretically rise without limit to infinity, the seller of an uncovered Call has theoretically unlimited loss potential if the underlying rallies aggressively.",
                "choices": [
                    ("Limited to the premium received", False),
                    ("Limited to the strike price minus premium received", False),
                    ("Theoretically unlimited", True),
                    ("Limited to the spot price at the time of trade", False),
                ],
            },
            {
                "topic": t_sebi,
                "text": "Under SEBI regulations, what is the maximum client-level position limit in equity index futures contracts for non-institutional retail participants?",
                "marks": Decimal("1.00"),
                "negative": Decimal("0.25"),
                "explanation": "SEBI specifies client-level open position limits as the higher of ₹500 crores or 5% of total open interest in the market for index contracts.",
                "choices": [
                    ("Higher of ₹500 crores or 5% of the total open interest in the market", True),
                    ("Fixed limit of 10,000 contracts irrespective of open interest", False),
                    ("Higher of ₹100 crores or 1% of total market turnover", False),
                    ("Strictly 15% of the broker's proprietary capital", False),
                ],
            },
            {
                "topic": t_basics,
                "text": "What is the primary difference between a Forward contract and a Futures contract regarding counterparty default risk?",
                "marks": Decimal("1.00"),
                "negative": Decimal("0.25"),
                "explanation": "Futures are exchange-traded and novated through a central clearing corporation that guarantees settlement, practically eliminating counterparty risk. Forwards are bilateral OTC contracts bearing direct counterparty default risk.",
                "choices": [
                    ("Forwards eliminate counterparty risk via central clearing, while Futures do not", False),
                    ("Futures contracts carry zero counterparty risk due to central clearing corporation novation and daily MTM", True),
                    ("Both Forwards and Futures carry identical default risks backed by banks", False),
                    ("Counterparty risk is only present in options contracts, not futures", False),
                ],
            },
            {
                "topic": t_options,
                "text": "Which of the following Greeks is always negative for long option positions (both Long Calls and Long Puts), reflecting time decay?",
                "marks": Decimal("1.00"),
                "negative": Decimal("0.25"),
                "explanation": "Theta (Θ) represents time decay. For long options, the extrinsic value erodes every single day as expiration approaches, making Theta negative for long positions.",
                "choices": [
                    ("Delta", False),
                    ("Gamma", False),
                    ("Theta", True),
                    ("Vega", False),
                ],
            },
            {
                "topic": t_futures,
                "text": "When a futures contract trades at a price LOWER than the current spot price of the underlying asset, this market condition is referred to as:",
                "marks": Decimal("1.00"),
                "negative": Decimal("0.25"),
                "explanation": "Backwardation (or inverted market) occurs when the futures price is below spot price. Normal market with Futures > Spot is termed Contango.",
                "choices": [
                    ("Contango", False),
                    ("Backwardation", True),
                    ("Carry trade", False),
                    ("Super-arbitrage", False),
                ],
            },
            {
                "topic": t_margins,
                "text": "Mark-to-Market (MTM) settlement in Indian exchange-traded equity derivatives takes place on which cycle?",
                "marks": Decimal("1.00"),
                "negative": Decimal("0.25"),
                "explanation": "Mark-to-Market settlement is executed daily on a T+1 basis (collected/credited next business day before market open).",
                "choices": [
                    ("T+0 (Immediate real-time auto debit/credit)", False),
                    ("T+1 (Next business day)", True),
                    ("Weekly on every Thursday", False),
                    ("Monthly on contract expiry date", False),
                ],
            },
            {
                "topic": t_options,
                "text": "A Bull Call Spread is constructed by:",
                "marks": Decimal("1.00"),
                "negative": Decimal("0.25"),
                "explanation": "A Bull Call Spread is created by buying a lower strike Call and simultaneously selling a higher strike Call with the same expiration date to offset net debit cost.",
                "choices": [
                    ("Buying a lower strike Call and selling a higher strike Call", True),
                    ("Buying a higher strike Call and selling a lower strike Call", False),
                    ("Buying a Call and buying a Put at the same strike", False),
                    ("Selling a Call and buying a stock", False),
                ],
            },
        ]

        # Clear existing questions for test 1 to avoid duplicates on re-run
        mock_test_1.questions.all().delete()

        for idx, qdata in enumerate(questions_data, start=1):
            q = Question.objects.create(
                mock_test=mock_test_1,
                topic=qdata["topic"],
                question_text=qdata["text"],
                marks=qdata["marks"],
                negative_marks=qdata["negative"],
                explanation=qdata["explanation"],
                order=idx,
            )
            for c_idx, (choice_text, is_correct) in enumerate(qdata["choices"], start=1):
                Choice.objects.create(
                    question=q,
                    choice_text=choice_text,
                    is_correct=is_correct,
                    order=c_idx,
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {len(certs_data)} certifications and {len(questions_data)} questions in '{mock_test_1.title}'!"
            )
        )

