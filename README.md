# EasyExam 🎯
### *Master Capital Markets, Algo Trading & Quantitative Finance Certifications*

Welcome to **EasyExam**! This is an online mock test and exam prep platform built specifically for students and finance professionals preparing for certifications in Indian capital markets, algorithmic trading, and quantitative finance.

Whether you're gearing up for **NISM Series VIII (Equity Derivatives)**, **NCFM Algorithmic Trading**, or a **Quantitative Risk & VaR** exam, EasyExam gives you an exam-accurate simulator with timed tests, negative marking, and personal analytics to track your readiness.

---

## 💡 What Makes EasyExam Special?

- ⏱️ **Official Exam Simulator**: Practice with the exact timer, 100 questions format, and the official 0.25 (25%) negative marking rules.
- 📊 **Smart Student Dashboard**: Track your overall readiness score, view detailed section-by-section score breakdowns, and revisit past mock attempts.
- 🔐 **Frictionless Authentication**: Powered by [Clerk](https://clerk.com) for secure one-click sign-in via Google or Email, with built-in account settings and profile management.
- 📱 **Sleek & Fast Interface**: A snappy, modern Single-Page Application (SPA) designed with a dark-mode fintech aesthetic.
- 📚 **Curated Certification Catalog**:
  - **NISM Series VIII**: Equity Derivatives
  - **NCFM**: Algorithmic Trading
  - **NISM Series XV**: Research Analyst
  - **Quant Finance**: Black-Scholes, VaR & Risk Management
  - **NISM Series XVI**: Commodity Derivatives

---

## 🛠️ The Tech Stack

This project is built as a modern decoupled full-stack application:

- **Frontend**: React 19, Vite, React Router DOM
- **Authentication**: Clerk React SDK (`@clerk/clerk-react`)
- **Backend**: Python 3.12+, Django, Django REST Framework
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **Styling**: Vanilla CSS with modern custom properties (dark theme, glassmorphism, responsive mobile layout)

---

## 📁 Project Structure

```text
EasyExam/
├── frontend/                   # React 19 + Vite Single Page Application
│   ├── src/
│   │   ├── pages/              # HomePage, DashboardPage, LoginPage, etc.
│   │   ├── components/         # Shared Navbar, Footer, and UI elements
│   │   ├── data/               # Exam catalogs and mock data
│   │   ├── App.jsx             # React Router and route guards
│   │   └── main.jsx            # ClerkProvider & React entry point
│   ├── .env.example            # Frontend environment variable template
│   └── package.json
│
├── apps/                       # Django backend applications
│   └── accounts/               # Custom user model & profile management
├── config/                     # Django core settings and URL routing
├── templates/                  # Original server-rendered template reference
├── manage.py                   # Django management script
├── requirements/               # Python dependencies
├── .env.example                # Backend environment variable template
└── .gitignore                  # Gitignore for Python, Django, and Node/Vite
```

---

## 🚀 Getting Started

To run EasyExam locally on your machine, follow these simple steps:

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- A free [Clerk](https://clerk.com) account (for authentication keys)

---

### 2. Frontend Setup (React + Vite)

1. Open your terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install the node packages:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a file named `.env.local` inside the `frontend` folder:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open **http://localhost:5173** in your browser.

---

### 3. Backend Setup (Django)

1. From the project root folder (`EasyExam/`), activate your Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\.venv\Scripts\activate
     ```
   - **Mac/Linux**:
     ```bash
     source .venv/bin/activate
     ```

2. Install Python requirements:
   ```bash
   pip install -r requirements/development.txt
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

4. Start the Django server:
   ```bash
   python manage.py runserver
   ```
   The backend will be live at **http://127.0.0.1:8000**.

---

## 🔒 Security & Privacy

- All sensitive keys (like database passwords and Clerk secrets) are kept in `.env` and `.env.local` files, which are strictly excluded from git tracking via `.gitignore`.
- Always keep `CLERK_SECRET_KEY` on the backend server; only expose `VITE_CLERK_PUBLISHABLE_KEY` to the React client.

---

## 🤝 Contributing & Next Steps

Upcoming roadmap items:
- [ ] Connect React exam simulator directly to Django REST endpoints
- [ ] Live exam countdown timer with automated auto-submit
- [ ] Instant PDF scorecards and weak-area performance diagnostics
- [ ] Question bookmarking and personal formula revision sheets

Enjoy practicing, and best of luck on your exams! 🚀
