# QAID – Quality Assurance Aid

**QAID** is an all-in-one platform for managing the entire software testing lifecycle — from test case creation to defect tracking, AI-powered test generation, screen recording, and insightful quality metrics. Built for QA teams, developers, and product owners who value speed, traceability, and automation in modern software delivery.

---

## 🚀 Features

### 🔍 Test Case Management
- Create, organize, and manage test cases in a flexible, taggable workspace
- Import test cases via files or external APIs
- AI-powered test case generation from product requirements

### 🐞 Bug Reporting
- Capture and submit detailed bug reports manually or directly from screen recordings
- Attach console logs and network tab data for rich context
- Integrated bug summary PDF generator (weekly/bi-weekly/monthly)

### 🎥 Screen Recorder with Network Tab
- In-browser screen recording with automatic bug reporting
- Captures video, network traffic, and context in one action
- Automatically links recording sessions to related test cases and bug reports

### 🤖 AI Test Generation
- Generate functional, edge, and negative test cases from user stories or uploaded requirement documents
- OpenAI-powered logic with support for prompt fine-tuning

### 🧪 Automated Testing Support
- Generate Cypress test scripts directly from manual test cases
- Store and manage automation metadata alongside manual cases
- Optional GitHub integration for CI/CD syncing

### 📊 QA Dashboards
- Visualize test coverage, bug trends, automation ratio, and execution history
- Export reports as PDF
- Filters for team, feature, sprint, and release

---

## 🔐 Authentication
- Google SSO and Email/Password sign-up
- Firebase Authentication used for secure access and permission-based routing

---

## ☁️ Tech Stack

| Layer        | Technology                     |
|--------------|--------------------------------|
| Frontend     | React (Next.js), Tailwind CSS  |
| Backend      | Firebase Firestore             |
| Auth         | Firebase Auth (Google, Email)  |
| Storage      | Google Drive API               |
| Documents    | Google Sheets API              |
| AI           | OpenAI API                     |
| Deployment   | Vercel                         |

---

## 🛠️ Dev Setup

```bash
git clone https://github.com/your-org/qaid.git
cd frontend
yarn install
yarn dev

Env Variables
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_DRIVE_FOLDER_ID=...
NEXT_PUBLIC_SHEETS_ID=...
OPENAI_API_KEY=...

Roadmap (Coming Soon)
Mobile support (mirror of web UI)
GitHub Actions for test sync
Sprint-based execution planner
Plugin SDK for custom integrations

Contributing 🤝 
Pull requests and issue reports are welcome. Please create a feature branch and follow the coding standards outlined in the CONTRIBUTING.md (coming soon).

About the Project
QAID was built to modernize QA workflows by blending manual processes, automation, and AI assistance — giving teams clarity, speed, and confidence in every release.

Contact
Feel free to reach out or contribute:
Email: qaidfid37is@gmail.com
Website: [https://qaid.app](https://qaid-phi.vercel.app/)
LinkedIn: fid37is
