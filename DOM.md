# InterviewXpert - Document Object Model (DOM)

## 1. Project Overview

**InterviewXpert** is an AI-powered recruitment and interview preparation platform that connects candidates with recruiters through automated video interviews with real-time behavioral analysis.

### Key Features
- AI-powered mock interviews with role-specific questions
- Real-time facial expression and behavioral analysis using Face-API.js
- Resume builder and ATS score analyzer
- Smart job matching algorithm
- Payment gateway integration (Razorpay) for premium features
- Admin dashboard for platform management

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19.2.0 with TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Routing**: React Router DOM 7.9.6
- **Styling**: Tailwind CSS 4.1.18
- **Animations**: Framer Motion 11.15.0, GSAP 3.14.2
- **Icons**: Lucide React 0.469.0

### Backend & Services
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage, Cloudinary
- **AI Services**: 
  - Google Gemini AI 1.30.0 (Question generation, feedback)
  - AssemblyAI (Speech-to-text transcription)
- **Computer Vision**: Face-API.js 1.7.15

### Utilities
- **PDF Processing**: PDF.js 5.4.530, jsPDF 3.0.4
- **Charts**: Recharts 3.5.0
- **Image Capture**: html2canvas 1.4.1

---

## 3. Application Architecture

### 3.1 Entry Point
```
index.tsx
  └── App.tsx (Root Component)
      └── AuthProvider (Context)
          └── HashRouter
              └── Routes
                  ├── Public Routes (Home, Auth)
                  └── Protected Routes (Layout Wrapper)
```

### 3.2 Directory Structure
```
interviewxpert-opencv/
├── components/          # Reusable UI components
├── context/             # React Context providers
├── pages/               # Page components (routes)
├── services/            # External service integrations
├── public/              # Static assets
├── src/                 # TypeScript definitions
├── types.ts             # TypeScript type definitions
├── App.tsx              # Main routing component
├── index.tsx            # Application entry point
└── vite.config.ts       # Vite configuration
```

---

## 4. Data Models

### 4.1 UserProfile
```typescript
interface UserProfile {
  uid: string;                    // Firebase Auth UID
  email: string;
  fullname: string;
  role: 'recruiter' | 'candidate' | 'admin';
  experience?: number;
  phone?: string;
  profilePhotoURL?: string;
  accountStatus: 'active' | 'disabled';
  createdAt: Timestamp;
  walletBalance?: number;          // For candidates (credits)
}
```

### 4.2 Job
```typescript
interface Job {
  id: string;
  title: string;
  description: string;
  companyName: string;
  qualifications: string;
  applyDeadline: Timestamp;
  interviewPermission: 'anyone' | 'request';
  recruiterUID: string;
  recruiterName: string;
  createdAt: Timestamp;
}
```

### 4.3 InterviewRequest
```typescript
interface InterviewRequest {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateUID: string;
  candidateName: string;
  recruiterUID: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
  respondedAt?: Timestamp;
}
```

### 4.4 Interview
```typescript
interface Interview {
  id: string;
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  candidateUID: string;
  candidateName: string;
  candidateEmail: string;
  candidateResumeURL: string;
  questions: string[];             // Array of 5 questions
  answers: (string | null)[];      // Video URLs or status
  videoURLs: (string | null)[];    // Cloudinary URLs
  transcriptIds: (string | null)[]; // AssemblyAI transcript IDs
  transcriptTexts: string[];        // Transcribed answers
  feedback: string;                 // AI-generated feedback
  score: string;                    // "85/100" format
  resumeScore: string;              // "80/100" format
  qnaScore: string;                 // "90/100" format
  status: string;                   // Interview status
  submittedAt: Timestamp;
  meta?: {
    tabSwitchCount: number;         // Anti-cheating metric
  };
}
```

### 4.5 InterviewState (Local State)
```typescript
interface InterviewState {
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  candidateResumeURL: string | null;
  candidateResumeMimeType: string | null;
  questions: string[];
  answers: (string | null)[];
  videoURLs: (string | null)[];
  transcriptIds: (string | null)[];
  transcriptTexts: (string | null)[];
  currentQuestionIndex: number;
}
```

### 4.6 Notification
```typescript
interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'message' | 'status_update';
  read: boolean;
  createdAt: Timestamp;
  senderId?: string;
  senderName?: string;
}
```

---

## 5. Component Hierarchy

### 5.1 Layout Components
```
Layout
├── Navigation Bar
│   ├── Logo
│   ├── Role-based Navigation Links
│   ├── NetworkStatus Indicator
│   ├── NotificationCenter
│   ├── Wallet Balance (Candidates)
│   └── Profile Dropdown
│       ├── Profile Info
│       ├── Theme Toggle (Light/Dark/System)
│       └── Sign Out
├── Main Content Area (children)
└── Footer
```

### 5.2 Reusable Components

#### DashboardCharts.tsx
- Displays analytics charts using Recharts
- Used in Recruiter and Admin dashboards

#### NotificationCenter.tsx
- Real-time notification display
- Mark as read functionality
- Badge count indicator

#### RecruiterMessageModal.tsx
- Modal for recruiters to send messages to candidates
- Integrated with notification service

### 5.3 Page Components

#### Public Pages
- **Home.tsx**: Landing page with authentication redirect
- **Auth.tsx**: Login/Signup page with Firebase Auth

#### Candidate Pages
- **CandidateDashboard.tsx**: Job listings with best matches filter
- **MyInterviews.tsx**: List of candidate's completed interviews
- **Interview.tsx**: Main interview wizard with video recording
- **ResumeAnalysis.tsx**: ATS score analysis against job descriptions
- **ResumeBuilder.tsx**: Resume creation tool
- **MockInterviewSetup.tsx**: Setup for practice interviews
- **MockHistory.tsx**: History of mock interviews
- **Payment.tsx**: Razorpay payment integration for credits

#### Recruiter Pages
- **RecruiterDashboard.tsx**: Job management dashboard
- **PostJob.tsx**: Create new job postings
- **EditJob.tsx**: Edit existing job postings
- **JobCandidates.tsx**: View candidates for a specific job
- **ManageCandidates.tsx**: Manage candidate statuses
- **InterviewRequests.tsx**: Accept/reject interview requests

#### Shared Pages
- **Profile.tsx**: User profile view/edit
- **InterviewReport.tsx**: Detailed interview results and feedback
- **Report.tsx**: Alternative report view

#### Admin Pages
- **AdminDashboard.tsx**: Platform administration
  - User management
  - Recruiter request approvals
  - System analytics

---

## 6. Service Layer

### 6.1 Firebase Service (`services/firebase.ts`)
```typescript
// Exports
- auth: Firebase Auth instance
- db: Firestore database instance
- storage: Firebase Storage instance
```

### 6.2 API Service (`services/api.ts`)

#### AI Functions
- **generateInterviewQuestions()**: Uses Gemini AI to generate 5 interview questions
  - Input: jobTitle, jobDescription, candidateExp, base64Resume, mimeType
  - Output: Array of 5 questions

- **generateFeedback()**: Generates comprehensive interview feedback
  - Input: job details, resume, questions, transcripts
  - Output: Structured feedback with scores (Resume, Q&A, Overall)

#### Cloudinary Functions
- **uploadToCloudinary()**: Uploads video/image blobs
  - Resource types: 'video' | 'image'
  - Returns: secure_url

#### AssemblyAI Functions
- **requestTranscription()**: Initiates audio transcription
  - Input: audioUrl
  - Output: transcriptId

- **fetchTranscriptText()**: Retrieves transcription result
  - Input: transcriptId
  - Output: { status, text }

### 6.3 Notification Service (`services/notificationService.ts`)
- **sendNotification()**: Creates notification document in Firestore
  - Types: 'message' | 'status_update'
  - Real-time updates via Firestore listeners

---

## 7. Context Providers

### 7.1 AuthContext (`context/AuthContext.tsx`)
```typescript
interface AuthContextType {
  user: User | null;              // Firebase Auth user
  userProfile: UserProfile | null; // Firestore user profile
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

**Features:**
- Real-time auth state monitoring
- Real-time user profile updates (onSnapshot)
- Automatic profile fetching on auth change
- Loading state management

### 7.2 ThemeContext (`context/ThemeContext.tsx`)
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  toggleTheme: () => void;
}
```

**Features:**
- System preference detection
- LocalStorage persistence
- Dark mode class management
- Smooth theme transitions

---

## 8. Routing Structure

### 8.1 Route Configuration (`App.tsx`)

#### Public Routes (No Layout)
- `/` → Home (redirects based on auth state)
- `/auth` → Authentication page

#### Protected Routes (With Layout)

**Admin Routes:**
- `/admin` → AdminDashboard

**Recruiter Routes:**
- `/recruiter/jobs` → RecruiterDashboard
- `/recruiter/post` → PostJob
- `/recruiter/edit-job/:jobId` → EditJob
- `/recruiter/job/:jobId/candidates` → JobCandidates
- `/recruiter/candidates` → ManageCandidates
- `/recruiter/requests` → InterviewRequests

**Candidate Routes:**
- `/candidate/jobs` → CandidateDashboard
- `/candidate/best-matches` → CandidateDashboard (bestMatches filter)
- `/candidate/interviews` → MyInterviews
- `/candidate/resume-analysis` → ResumeAnalysis
- `/candidate/resume-builder` → ResumeBuilder
- `/candidate/mock-interview` → MockInterviewSetup
- `/candidate/mock-history` → MockHistory
- `/candidate/payment` → Payment
- `/interview/:jobId` → Interview (Interview Wizard)

**Shared Routes:**
- `/report/:interviewId` → InterviewReport
- `/profile` → Profile (own profile)
- `/profile/:userId` → Profile (view other user)

### 8.2 Route Protection
- **ProtectedRoute Component**: Wraps protected routes
  - Checks authentication state
  - Validates user role
  - Redirects to appropriate dashboard on role mismatch
  - Shows loading spinner during auth check

---

## 9. Database Schema (Firestore)

### 9.1 Collections

#### `users/{userId}`
- Stores user profiles
- Fields: uid, email, fullname, role, experience, phone, profilePhotoURL, accountStatus, createdAt, walletBalance

#### `jobs/{jobId}`
- Stores job postings
- Fields: title, description, companyName, qualifications, applyDeadline, interviewPermission, recruiterUID, recruiterName, createdAt

#### `interviews/{interviewId}`
- Stores completed interview data
- Fields: jobId, jobTitle, jobDescription, candidateUID, candidateName, candidateEmail, candidateResumeURL, questions, answers, videoURLs, transcriptIds, transcriptTexts, feedback, score, resumeScore, qnaScore, status, submittedAt, meta

#### `interviewRequests/{requestId}`
- Stores interview permission requests
- Fields: jobId, jobTitle, candidateUID, candidateName, recruiterUID, status, createdAt, respondedAt

#### `notifications/{notificationId}`
- Stores user notifications
- Fields: userId, message, type, read, createdAt, senderId, senderName

#### `profiles/{userId}`
- Extended profile information (if used separately from users)

#### `recruiterRequests/{requestId}`
- Stores recruiter registration requests (for admin approval)

### 9.2 Security Rules (`firestore.rules`)

**Users:**
- Admins: Full read/write access
- Self: Read/update own profile
- Recruiters: Read all users, update candidate status

**Jobs:**
- Public: Read access
- Recruiters: Create/update/delete own jobs
- Admins: Full access

**Interviews:**
- Candidates: Create own interviews, read own interviews
- Recruiters: Read all interviews
- Admins: Full access

**Interview Requests:**
- Candidates: Create requests
- Recruiters: Read/update requests for their jobs
- Admins: Full access

**Notifications:**
- Users: Read own notifications, create notifications
- Admins: Full access

---

## 10. External Integrations

### 10.1 Firebase
- **Authentication**: Email/password, Google OAuth
- **Firestore**: Real-time database
- **Storage**: File uploads (resumes, profile photos)

### 10.2 Google Gemini AI
- **Model**: gemini-2.5-flash
- **Uses**:
  - Interview question generation
  - Resume analysis
  - Interview feedback generation
- **Input**: Text prompts + base64 image (resume)

### 10.3 AssemblyAI
- **Purpose**: Speech-to-text transcription
- **Workflow**:
  1. Upload video to Cloudinary
  2. Request transcription with audio URL
  3. Poll for completion
  4. Retrieve transcript text

### 10.4 Cloudinary
- **Purpose**: Media storage (videos, images)
- **Resources**:
  - Video uploads (interview recordings)
  - Image uploads (resumes, profile photos)
- **Upload Preset**: Configured via environment variable

### 10.5 Razorpay
- **Purpose**: Payment processing for candidate credits
- **Integration**: Payment page component

### 10.6 Face-API.js
- **Purpose**: Real-time facial analysis during interviews
- **Features**:
  - Eye contact detection
  - Facial expression analysis
  - Confidence level assessment
- **Loading**: Dynamic script injection

---

## 11. Interview Flow

### 11.1 Interview Wizard Steps (`pages/Interview.tsx`)

1. **check-exists**: Verify if interview already exists
2. **instructions**: Display interview guidelines
3. **check-profile**: Verify candidate profile completeness
4. **setup**: 
   - Load Face-API models
   - Generate questions (Gemini AI)
   - Resume upload/processing
5. **interview**: 
   - Question-by-question video recording
   - Real-time face detection
   - Tab switch detection (anti-cheating)
   - 2-minute timer per question
6. **processing**:
   - Upload videos to Cloudinary
   - Request transcriptions (AssemblyAI)
   - Poll for transcript completion
   - Generate feedback (Gemini AI)
   - Save to Firestore
7. **finish**: Display completion message

### 11.2 Interview Features
- **Question Timer**: 2 minutes per question
- **Face Detection**: Real-time analysis overlay
- **Tab Switch Detection**: Tracks cheating attempts
- **Video Recording**: MediaRecorder API
- **Tic-Tac-Toe Game**: Shown during video upload (entertainment)

---

## 12. State Management

### 12.1 Global State
- **AuthContext**: User authentication and profile
- **ThemeContext**: UI theme preferences

### 12.2 Local State
- Component-level useState hooks
- Interview wizard state (InterviewState interface)
- Form states in various pages

### 12.3 Real-time Updates
- Firestore onSnapshot listeners:
  - User profile updates
  - Notification updates
  - Interview status changes

---

## 13. Environment Variables

Required environment variables:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_GEMINI_API_KEY
VITE_ASSEMBLYAI_API_KEY
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_UPLOAD_PRESET
VITE_RAZORPAY_KEY_ID
```

---

## 14. Build Configuration

### 14.1 Vite Config (`vite.config.ts`)
- **Port**: 3000
- **Host**: 0.0.0.0 (accessible on network)
- **Target**: esnext
- **Aliases**: `@` → project root
- **Environment**: Loads .env variables

### 14.2 TypeScript Config (`tsconfig.json`)
- React JSX mode
- ES module support
- Strict type checking

---

## 15. Key Features Implementation

### 15.1 Best Matches Algorithm
- Compares candidate profile with job requirements
- Calculates match score
- Filters and sorts jobs by relevance

### 15.2 Resume Analysis
- Extracts text from PDF resume
- Compares with job description
- Generates ATS compatibility score

### 15.3 Anti-Cheating Measures
- Tab switch detection
- Face detection during interview
- Timer enforcement
- Video recording verification

### 15.4 Payment System
- Razorpay integration
- Credit-based system for mock interviews
- Wallet balance tracking in user profile

---

## 16. Component Communication Flow

```
User Action
    ↓
Page Component
    ↓
Service Layer (API calls)
    ↓
Firebase/External APIs
    ↓
State Update (Context/Local)
    ↓
UI Re-render
```

---

## 17. Error Handling

- Try-catch blocks in async functions
- Error logging to console
- User-friendly error messages
- Loading states during async operations
- Fallback UI for failed operations

---

## 18. Performance Optimizations

- Code splitting via React Router
- Lazy loading of Face-API models
- Image optimization via Cloudinary
- Real-time listeners cleanup
- Memoization where applicable

---

## 19. Security Considerations

- Firestore security rules enforcement
- Authentication required for protected routes
- Role-based access control
- Environment variables for sensitive keys
- Client-side API key usage (noted as security concern in code)

---

## 20. Future Enhancements (Potential)

- Server-side API for sensitive operations
- Enhanced analytics dashboard
- Email notifications
- Multi-language support
- Advanced resume parsing
- Interview scheduling system
- Video call integration for live interviews

---

## Document Version
**Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Development Team
