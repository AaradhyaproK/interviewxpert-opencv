import { Timestamp } from 'firebase/firestore';

export type UserRole = 'recruiter' | 'candidate';

export interface UserProfile {
  uid: string;
  email: string;
  fullname: string;
  role: UserRole;
  experience?: number;
  phone?: string;
  profilePhotoURL?: string;
  accountStatus: 'active' | 'disabled';
  createdAt: Timestamp;
}

export interface Job {
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

export interface InterviewRequest {
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

export interface Interview {
  id: string;
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  candidateUID: string;
  candidateName: string;
  candidateEmail: string;
  candidateResumeURL: string;
  questions: string[];
  answers: (string | null)[]; // status strings or placeholders
  videoURLs: (string | null)[];
  transcriptIds: (string | null)[];
  transcriptTexts: string[];
  feedback: string;
  score: string; // "85/100"
  resumeScore: string;
  qnaScore: string;
  status: string;
  submittedAt: Timestamp;
  meta?: {
    tabSwitchCount: number;
  };
}

export interface InterviewState {
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
