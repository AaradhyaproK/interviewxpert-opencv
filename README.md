# InterviewXpert 🚀

![InterviewXpert Logo](https://i.ibb.co/3y9DKsB6/Yellow-and-Black-Illustrative-Education-Logo-1.png)

**Master Your Next Interview with AI.**

InterviewXpert is a cutting-edge recruitment and interview preparation platform that leverages Artificial Intelligence and Computer Vision to help candidates land their dream jobs and assist recruiters in finding the perfect talent.

## 🌟 Key Features

### 👨‍💼 For Candidates
- **AI Mock Interviews**: Practice with an intelligent AI interviewer that asks role-specific questions tailored to your profile.
- **Real-time Behavioral Analysis**: Uses **Face-API.js** to analyze eye contact, facial expressions, and confidence levels during the interview.
- **Resume Builder & Analyzer**: Create professional resumes and get an instant ATS score compared against job descriptions.
- **Smart Job Matching**: Get "Best Match" recommendations based on your skills and profile.
- **Detailed Performance Reports**: Receive comprehensive feedback on your technical accuracy, communication skills, and body language.
- **Wallet System**: Integrated payment gateway (Razorpay) to purchase credits for premium mock interviews.

### 👩‍💻 For Recruiters
- **Effortless Job Posting**: Create and manage job listings with detailed requirements.
- **Automated Screening**: View AI-generated interview reports and scores for every candidate.
- **Candidate Management**: Track application statuses (Pending, Shortlisted, Hired, Rejected).
- **Interview Playback**: Watch recorded video responses and read transcripts.

## 🛠️ Tech Stack

- **Frontend**: React.js, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion (Animations)
- **Backend & Auth**: Firebase (Firestore, Authentication)
- **AI & Computer Vision**: Face-API.js (Client-side), OpenAI (Content generation)
- **Charts & Visualization**: Recharts
- **Payments**: Razorpay
- **PDF Handling**: PDF.js, jsPDF

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AaradhyaproK/interviewxpert-opencv.git
   cd interviewxpert-opencv
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory and add your Firebase and API keys:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_RAZORPAY_KEY_ID=your_razorpay_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📸 Screenshots

| Dashboard | AI Interview |
|-----------|--------------|
| !Dashboard | !Interview |

## 👥 Contributors

Developed & Designed with ❤️ by:

- **Aaradhya Pathak** - Full Stack Developer
- **Nimesh Kulkarni**
- **Bhavesh Patil**
- **Sanika Wadnekar**

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.