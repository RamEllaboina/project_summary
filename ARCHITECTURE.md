# AI-POWERED CODE ANALYZER – SYSTEM ARCHITECTURE

## 5. ONE-LINE SYSTEM DESCRIPTION

The system combines static analysis, AI-based code evaluation, AI-generated code detection, and secure sandbox execution into a unified code intelligence platform.

## 6. ONE-LINE WORKFLOW

Code Input → FastAPI Processing → Static Analysis → AI Quality Evaluation → AI Code Detection → Secure Execution → Result Aggregation → Unified Report

---

## 1. SYSTEM ARCHITECTURE

```text
USER
│
├── Upload Code
├── Paste Code
└── Provide Prompt
│
▼
FRONTEND
│
├── Web Interface / VS Code UI
├── React / TypeScript
└── Code Upload & Input
│
▼
FASTAPI BACKEND
│
├── Request Handling
├── Authentication
├── Orchestration Service
└── Response Aggregation
│
▼
CORE ANALYSIS ENGINE
│
├── 1. STATIC CODE ANALYSIS
│   ├── Linting
│   ├── SAST
│   ├── Vulnerability Detection
│   └── Code Structure Analysis
│
├── 2. AI CODE QUALITY EVALUATION
│   ├── Code Review
│   ├── Maintainability
│   ├── Readability
│   ├── Efficiency
│   └── Quality Scoring
│
├── 3. AI-GENERATED CODE DETECTION
│   ├── Statistical Features
│   ├── AST / Code Features
│   ├── ML / LLM Classification
│   └── AI Generation Probability
│
└── 4. SECURE SANDBOX EXECUTION
    ├── Execute Submitted Code
    ├── Capture Output
    ├── Capture Errors
    └── Apply Resource Restrictions


SUPPORTING COMPONENTS

AI / ML MODELS
│
├── Code Quality Model
├── AI Detection Model
├── Vulnerability Detection Model
└── Ensemble / Hybrid Model


DATA STORAGE
│
├── Database
├── Analysis Results
├── Logs
└── Reports


SECURE SANDBOX ENVIRONMENT
│
├── Docker Container
├── Namespaces
├── cgroups
├── Seccomp-BPF
├── Network Isolation
└── CPU / Memory / Time Limits


EXTERNAL SERVICES
│
├── LLM API
├── CVE / CWE Database
└── Code Datasets


RESULT AGGREGATION
│
└── Combines:
    ├── Static Analysis Results
    ├── AI Quality Results
    ├── AI Detection Results
    └── Sandbox Execution Results
│
▼
OUTPUT / UNIFIED REPORT
│
├── Overall Score
├── Code Quality Score
├── Security Vulnerabilities
├── AI Detection Probability
├── Complexity Analysis
├── Strengths
├── Weaknesses
├── AI Summary
├── Suggestions & Explanation
└── Execution Output / Errors
```

---

## 2. SYSTEM WORKFLOW

```text
START
  │
  ▼
User Submits Source Code
  │
  ▼
Frontend Receives Code
  │
  ▼
Code Sent to FastAPI Backend
  │
  ▼
Backend Validates Request
  │
  ▼
STATIC CODE ANALYSIS
  │
  ├── Complexity Analysis
  ├── Code Structure Analysis
  ├── Linting
  └── Security Vulnerability Detection
  │
  ▼
AI CODE QUALITY ANALYSIS
  │
  ├── Maintainability
  ├── Readability
  ├── Efficiency
  └── Quality Score
  │
  ▼
AI-GENERATED CODE DETECTION
  │
  ├── Code Patterns
  ├── Statistical Features
  ├── AST Features
  └── AI Generation Probability
  │
  ▼
SECURE SANDBOX EXECUTION
  │
  ├── Execute Code
  ├── Capture Output
  ├── Capture Errors
  └── Enforce Resource Limits
  │
  ▼
RESULT AGGREGATION
  │
  ├── Quality Results
  ├── Security Results
  ├── AI Detection Results
  ├── Complexity Results
  └── Execution Results
  │
  ▼
GENERATE UNIFIED REPORT
  │
  ▼
DISPLAY DASHBOARD
  │
  ├── Overall Score
  ├── Code Quality
  ├── Security Health
  ├── AI Generation Probability
  ├── Complexity
  ├── Strengths
  ├── Weaknesses
  ├── AI Summary
  └── Sandbox Results
  │
  ▼
END
```

---

## 3. MAIN WORKFLOW FOR PPT

```text
Code Input
    ↓
FastAPI Processing
    ↓
Static Analysis
    ↓
AI Quality Evaluation
    ↓
AI-Generated Code Detection
    ↓
Secure Sandbox Execution
    ↓
Result Aggregation
    ↓
Unified Report
```

---

## 4. DASHBOARD MAPPING

| Architecture Component | Dashboard Output |
| :--- | :--- |
| Static Analysis | Security Health |
| Complexity Analysis | Complexity |
| AI Quality Evaluation | Code Quality / Overall Score |
| AI Code Detection | AI Generation Probability |
| Secure Sandbox | Sandbox / Execution Result |
| Result Aggregation | Overall Score |
| AI Analysis | AI Summary |
| Analysis Engine | Strengths & Weaknesses |
