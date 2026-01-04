# InterviewXpert - AI-Powered Interview Preparation Platform

<p align="center">
  <img src="https://i.ibb.co/3y9DKsB6/Yellow-and-Black-Illustrative-Education-Logo-1.png" alt="InterviewXpert Logo" width="150">
</p>

<p align="center">
  <strong>Master your next interview with a fully automated AI platform.</strong>
</p>

<p align="center">
  <a href="https://app.netlify.com/sites/deluxe-mandazi-eb510d/deploys"><img src="https://api.netlify.com/api/v1/badges/a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6/deploy-status" alt="Netlify Status"></a>
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Vite-6.2-purple?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Firebase-12.6-orange?logo=firebase" alt="Firebase">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-blue?logo=tailwindcss" alt="Tailwind CSS">
</p>

---

## ✨ Features

InterviewXpert is an all-in-one platform designed to help candidates and recruiters streamline the interview process.

### For Candidates:

*   🤖 **AI Mock Interviews**: Practice with a fully automated AI interviewer that asks relevant questions based on the job role and your resume.
*   📊 **Real-time Feedback**: Get instant, detailed analysis of your answers, including scores for technical knowledge, communication, and behavioral skills.
*   📄 **AI Resume Builder**: Create professional, ATS-friendly resumes in minutes using a step-by-step wizard with multiple templates.
*   🔍 **Smart Resume Analysis**: Upload your resume and a job description to get an instant ATS score, keyword analysis, and actionable improvement tips.
*   🎯 **Best Match Jobs**: Our algorithm matches your profile skills with available jobs to show you the most relevant opportunities.
*   📈 **Profile & Progress Tracking**: View your interview history, track your scores, and manage your professional profile.

### For Recruiters:

*   📝 **Post & Manage Jobs**: Easily post new job openings and manage them from a central dashboard.
*   👥 **Candidate Management**: View a list of candidates who have applied or requested interviews for your jobs.
*   ✅ **Interview Requests**: Accept or reject interview requests from candidates.
*   👤 **View Candidate Profiles**: Get a comprehensive view of a candidate's skills, experience, and bio.

---

## 🚀 Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later)
*   `npm` or `yarn`
*   A Firebase project with Authentication and Firestore enabled.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/AaradhyaproK/interviewXpert-React-.git
    cd interviewXpert-React-
    ```

2.  **Install NPM packages:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of your project and add your Firebase configuration keys. You can find these in your Firebase project settings.

    ```env
    VITE_FIREBASE_API_KEY="your_api_key"
    VITE_FIREBASE_AUTH_DOMAIN="your_auth_domain"
    VITE_FIREBASE_PROJECT_ID="your_project_id"
    VITE_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
    VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
    VITE_FIREBASE_APP_ID="your_app_id"
    VITE_GEMINI_API_KEY="your_google_ai_api_key"
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000` (or another port if 3000 is in use).

---

## 🛠️ Built With

*   **Frontend:** React, Vite, TypeScript
*   **Styling:** Tailwind CSS
*   **Backend & Database:** Firebase (Authentication, Firestore)
*   **AI Integration:** Google Gemini API
*   **Routing:** React Router
*   **PDF Handling:** jsPDF, pdfjs-dist

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---

## 🧑‍💻 Developed & Designed By

*   **Aaradhya Pathak** - Portfolio | GitHub
*   **Nimesh Kulkarni**
*   **Bhavesh Patil**
*   **Sanika Wadnekar**

---

## 📄 License

This project is licensed under the MIT License - see the `LICENSE.md` file for details.
