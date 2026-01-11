import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { uploadToCloudinary, generateInterviewQuestions, requestTranscription, fetchTranscriptText, generateFeedback } from '../services/api';
import { Job, InterviewState } from '../types';
import Recharts from 'recharts'; // Dummy import

// --- Types ---
type WizardStep = 'check-exists' | 'instructions' | 'check-profile' | 'setup' | 'interview' | 'processing' | 'finish';

// --- Helper: Load Face API ---
const loadFaceAPI = (onLoaded: () => void) => {
  if ((window as any).faceapi) {
    onLoaded();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js';
  script.async = true;
  script.onload = onLoaded;
  document.body.appendChild(script);
};

const QUESTION_TIME_MS = 2 * 60 * 1000; // 2 minutes

// --- Component: Tic-Tac-Toe (Glassmorphic & Dark Mode) ---
const TicTacToe: React.FC = () => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  const checkWinner = (squares: (string | null)[]) => {
    const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    return null;
  };

  const handleClick = (i: number) => {
    if (winner || board[i] || !isXNext) return;
    const newBoard = [...board];
    newBoard[i] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
    const w = checkWinner(newBoard);
    if (w) setWinner(w);
  };

  useEffect(() => {
    if (!isXNext && !winner) {
      const timer = setTimeout(() => {
        const available = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
        if (available.length > 0) {
          const random = available[Math.floor(Math.random() * available.length)];
          const newBoard = [...board];
          newBoard[random as number] = 'O';
          setBoard(newBoard);
          setIsXNext(true);
          const w = checkWinner(newBoard);
          if (w) setWinner(w);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isXNext, winner, board]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/90 backdrop-blur-md rounded-xl transition-all duration-300">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        {winner ? (winner === 'X' ? 'You Won! 🎉' : 'AI Won! 🤖') : (isXNext ? 'Your Turn (X)' : 'AI Thinking...')}
      </h3>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {board.map((cell, i) => (
          <button 
            key={i} 
            onClick={() => handleClick(i)} 
            disabled={!!cell || !!winner || !isXNext} 
            className={`w-20 h-20 text-3xl font-bold flex items-center justify-center rounded-xl shadow-inner transition-all 
              ${cell === 'X' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 
                cell === 'O' ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' : 
                'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'}`}
          >
            {cell}
          </button>
        ))}
      </div>
      {winner ? (
        <button onClick={() => { setBoard(Array(9).fill(null)); setIsXNext(true); setWinner(null); }} className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-colors">
          Play Again
        </button>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 animate-pulse font-medium">Uploading... Play while you wait!</p>
      )}
    </div>
  );
};

// --- Main Wizard Component ---
const InterviewWizard: React.FC = () => {
  const { jobId } = useParams();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  // Global Interview State
  const [step, setStep] = useState<WizardStep>('check-exists');
  const [job, setJob] = useState<Job | null>(null);
  const [interviewState, setInterviewState] = useState<InterviewState>({
    jobId: '', jobTitle: '', jobDescription: '', candidateResumeURL: null, candidateResumeMimeType: null,
    questions: [], answers: [], videoURLs: [], transcriptIds: [], transcriptTexts: [], currentQuestionIndex: 0
  });
  
  const [loadingMsg, setLoadingMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [tabSwitches, setTabSwitches] = useState(0);
  const [speedStatus, setSpeedStatus] = useState<string | null>(null);
  const [cvStats, setCvStats] = useState<any>(null);

  // 1. Init
  useEffect(() => {
    const init = async () => {
      if (!user || !jobId) return;
      try {
        const q = query(collection(db, 'interviews'), where('candidateUID', '==', user.uid), where('jobId', '==', jobId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          alert("Interview already completed.");
          navigate('/candidate/interviews');
          return;
        }
        const jobDoc = await getDoc(doc(db, 'jobs', jobId));
        if (!jobDoc.exists()) throw new Error("Job not found");
        setJob({ id: jobDoc.id, ...jobDoc.data() } as Job);
        setStep('instructions');
      } catch (err) { setErrorMsg("Initialization failed."); }
    };
    init();
  }, [user, jobId, navigate]);

  // 2. Profile Logic (Replaces Resume Upload)
  const handleStartWithProfile = async () => {
    if (!user || !job) return;

    // Trigger fullscreen immediately on user interaction
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.error("Fullscreen blocked", e);
    }

    setLoadingMsg("Analyzing your profile data...");
    setStep('setup'); 

    try {
      // Fetch detailed profile data from 'profiles' collection
      const profileDocRef = doc(db, 'profiles', user.uid);
      const profileDocSnap = await getDoc(profileDocRef);
      const profileData = profileDocSnap.exists() ? profileDocSnap.data() : {};

      // Combine with AuthContext userProfile
      const combinedProfile = {
        fullname: userProfile?.fullname || user.displayName || 'Candidate',
        skills: profileData.skills || '',
        experienceText: profileData.experience || '', // Detailed experience text
        experienceYears: userProfile?.experience || 0, // Numeric years
        bio: profileData.bio || '',
        education: profileData.education || ''
      };

      // Construct a text representation of the profile to act as the "resume"
      const profileText = `
        Name: ${combinedProfile.fullname}
        Skills: ${combinedProfile.skills}
        Experience (Years): ${combinedProfile.experienceYears}
        Experience Details: ${combinedProfile.experienceText}
        Bio: ${combinedProfile.bio}
        Education: ${combinedProfile.education}
      `;
      
      // Convert text to base64 for the AI generator
      const base64String = btoa(unescape(encodeURIComponent(profileText)));
      // Use Data URI to avoid uploading text file as image/raw which might fail validation
      const resumeUrl = `data:text/plain;base64,${base64String}`;

      setLoadingMsg("AI is generating tailored questions based on your profile... (approx 30s)");
      const questions = await generateInterviewQuestions(
        job.title, job.description, `${combinedProfile.experienceYears} years`, base64String, 'text/plain'
      );

      setInterviewState(prev => ({
        ...prev, jobId: job.id, jobTitle: job.title, jobDescription: job.description, candidateResumeURL: resumeUrl, candidateResumeMimeType: 'text/plain',
        questions: questions, answers: Array(questions.length).fill(null), videoURLs: Array(questions.length).fill(null), transcriptIds: Array(questions.length).fill(null), transcriptTexts: Array(questions.length).fill(null),
      }));
      setStep('interview');

    } catch (err: any) { setErrorMsg(err.message); setStep('check-profile'); }
  };

  const checkSpeed = () => {
    setSpeedStatus("Checking...");
    const start = Date.now();
    const img = new Image();
    img.onload = () => {
      const duration = (Date.now() - start) / 1000;
      const speed = (50 * 8) / duration; 
      setSpeedStatus(speed > 1000 ? "Excellent 🚀" : speed > 500 ? "Good 🟢" : "Weak 🔴");
    };
    img.src = "https://i.ibb.co/3y9DKsB6/Yellow-and-Black-Illustrative-Education-Logo-1.png?t=" + start;
  };

  // --- RENDER ---
  const Container = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-gray-100 flex flex-col items-center justify-center p-4 transition-colors duration-500">
      {children}
    </div>
  );

  if (step === 'check-exists' || !job) {
    return (
      <Container>
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-3 border-t-4 border-purple-500 rounded-full animate-spin reverse"></div>
        </div>
      </Container>
    );
  }

  if (step === 'instructions') {
    return (
      <Container>
        <div className="max-w-3xl w-full p-4 md:p-0">
          <h2 className="text-3xl font-extrabold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ready for your AI Interview?
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Role: {job.title}</p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl flex items-start gap-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg text-blue-600 dark:text-blue-300"><i className="fas fa-video text-xl"></i></div>
              <div><h4 className="font-bold">Camera On</h4><p className="text-sm text-gray-600 dark:text-gray-400">Ensure good lighting.</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl flex items-start gap-4 shadow-sm border border-gray-100 dark:border-gray-700">
               <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded-lg text-purple-600 dark:text-purple-300"><i className="fas fa-clock text-xl"></i></div>
               <div><h4 className="font-bold">2 Minutes</h4><p className="text-sm text-gray-600 dark:text-gray-400">Time limit per answer.</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl flex items-start gap-4 shadow-sm border border-gray-100 dark:border-gray-700">
               <div className="bg-green-100 dark:bg-green-800 p-2 rounded-lg text-green-600 dark:text-green-300"><i className="fas fa-brain text-xl"></i></div>
               <div><h4 className="font-bold">AI Generated</h4><p className="text-sm text-gray-600 dark:text-gray-400">Tailored to your resume.</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl flex items-start gap-4 shadow-sm border border-gray-100 dark:border-gray-700">
               <div className="bg-red-100 dark:bg-red-800 p-2 rounded-lg text-red-600 dark:text-red-300"><i className="fas fa-eye text-xl"></i></div>
               <div><h4 className="font-bold">Proctored</h4><p className="text-sm text-gray-600 dark:text-gray-400">Tab switching is tracked.</p></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t dark:border-gray-700">
             <button onClick={checkSpeed} className="text-sm font-medium flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
               <i className="fas fa-wifi"></i> Check Speed {speedStatus && <span className={`px-2 py-0.5 rounded text-xs ${speedStatus.includes('Excellent') || speedStatus.includes('Good') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{speedStatus}</span>}
             </button>
             <button onClick={() => setStep('check-profile')} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all">
               I'm Ready, Let's Go
             </button>
          </div>
        </div>
      </Container>
    );
  }

  if (step === 'check-profile') {
    return (
      <Container>
        <div className="max-w-md w-full p-4 md:p-0">
          <h2 className="text-2xl font-bold mb-2">Profile Check</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">We will use your profile data to generate interview questions.</p>
          
          {errorMsg && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800">{errorMsg}</div>}
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300">
                <i className="fas fa-user-circle text-xl"></i>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white">{userProfile?.fullname}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Profile Data Ready</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button onClick={() => setStep('instructions')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium">Back</button>
            <button onClick={handleStartWithProfile} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 shadow-md">
              Start Interview
            </button>
          </div>
        </div>
      </Container>
    );
  }

  if (step === 'setup' || step === 'processing') {
    return (
      <Container>
        <div className="flex flex-col items-center max-w-md text-center">
           <div className="relative w-24 h-24 mb-6">
             <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
             <i className="fas fa-robot absolute inset-0 flex items-center justify-center text-3xl text-gray-400 dark:text-gray-500"></i>
           </div>
           <h3 className="text-xl font-bold text-gray-800 dark:text-white animate-pulse">{loadingMsg}</h3>
           <p className="mt-4 text-gray-500 dark:text-gray-400 italic text-sm">"The first computer mouse was made of wood."</p>
        </div>
      </Container>
    );
  }

  if (step === 'interview') {
    return (
      <ActiveInterviewSession 
        state={interviewState} 
        setState={setInterviewState}
        onFinish={(stats: any) => {
          setCvStats(stats);
          setStep('finish');
        }}
        onTabSwitch={() => setTabSwitches(prev => prev + 1)}
      />
    );
  }

  if (step === 'finish') {
    return <InterviewSubmission state={interviewState} tabSwitches={tabSwitches} user={user!} userProfile={userProfile!} cvStats={cvStats} />;
  }

  return null;
};

// --- Sub-Component: Active Interview (Immersive) ---
const ActiveInterviewSession: React.FC<{
  state: InterviewState;
  setState: React.Dispatch<React.SetStateAction<InterviewState>>;
  onFinish: (cvStats: any) => void;
  onTabSwitch: () => void;
}> = ({ state, setState, onFinish, onTabSwitch }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_MS / 1000);
  const [countdown, setCountdown] = useState(5);
  const [processingVideo, setProcessingVideo] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const currentQ = state.questions[state.currentQuestionIndex];
  const [faceApiReady, setFaceApiReady] = useState(false);
  
  // Computer Vision State Refs (Simulating OpenCV)
  const cvDataRef = useRef({
    eyeContactFrames: 0,
    totalFrames: 0,
    confidenceScoreAcc: 0,
    facesDetectedMax: 0,
    expressions: { neutral: 0, happy: 0, surprised: 0, fearful: 0, sad: 0, angry: 0, disgusted: 0 } as Record<string, number>
  });

  // Load FaceAPI
  useEffect(() => {
    loadFaceAPI(async () => {
      const faceapi = (window as any).faceapi;
      try {
        // Load models from CDN
        const modelUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
        await faceapi.nets.faceExpressionNet.loadFromUri(modelUrl);
        console.log("FaceAPI Models Loaded");
        setFaceApiReady(true);
      } catch (e) {
        console.error("Error loading FaceAPI models", e);
      }
    });
  }, []);

  // Real AI Analysis Loop
  useEffect(() => {
    if (!isRecording || !faceApiReady || !videoRef.current) return;
    
    const faceapi = (window as any).faceapi;
    const video = videoRef.current;
    
    // Motion detection setup
    const canvas = document.createElement('canvas');
    canvas.width = 320; // Low res for performance
    canvas.height = 240;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let prevFrame: Uint8ClampedArray | null = null;

    const interval = setInterval(async () => {
      try {
        if (video.paused || video.ended || !ctx) return;

        // 1. Face Analysis
        // Using TinyFaceDetector for speed
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
        
        cvDataRef.current.totalFrames++;
        
        if (detections && detections.length > 0) {
            // Assume the largest face is the candidate
            const mainFace = detections[0]; 
            
            // Eye Contact (Proxy: Face detected = looking at screen)
            cvDataRef.current.eyeContactFrames++;
            
            // Person Detection
            cvDataRef.current.facesDetectedMax = Math.max(cvDataRef.current.facesDetectedMax, detections.length);
            
            // Expressions
            const expr = mainFace.expressions;
            // Find dominant expression
            const sorted = Object.entries(expr).sort((a: any, b: any) => b[1] - a[1]);
            const dominant = sorted[0][0]; // e.g., 'neutral'
            if (cvDataRef.current.expressions[dominant] !== undefined) {
                cvDataRef.current.expressions[dominant]++;
            }
        }

        // 2. Motion Analysis (Confidence)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        if (prevFrame) {
            let diff = 0;
            // Simple pixel diff (skip alpha)
            for (let i = 0; i < frame.length; i += 4) {
                if (Math.abs(frame[i] - prevFrame[i]) > 20 || 
                    Math.abs(frame[i+1] - prevFrame[i+1]) > 20 || 
                    Math.abs(frame[i+2] - prevFrame[i+2]) > 20) {
                    diff++;
                }
            }
            const motionPercent = diff / (canvas.width * canvas.height);
            // Confidence score: High motion = Low confidence (fidgeting)
            // Baseline: 0 motion = 100 confidence. 
            const score = Math.max(0, 100 - (motionPercent * 500)); 
            cvDataRef.current.confidenceScoreAcc += score;
        }
        prevFrame = new Uint8ClampedArray(frame);

      } catch (err) {
        console.error("AI Processing Error", err);
      }
    }, 500); // 2 FPS is enough for analysis and saves CPU

    return () => {
        clearInterval(interval);
    };
  }, [isRecording, faceApiReady]);

  // Tab Visibility
  useEffect(() => {
    const handleVisibility = () => { if (document.hidden) onTabSwitch(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [onTabSwitch]);

  // Camera
  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) { alert("Camera permission denied. Please allow access."); }
    };
    setupCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  // TTS
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(currentQ);
        window.speechSynthesis.speak(utterance);
      }, 500);
    }
  }, [currentQ]);

  // Auto-Logic
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (countdown === 0 && !isRecording && !processingVideo && !isStopping) {
      startRecording();
    }
  }, [countdown, isRecording, processingVideo, isStopping]);

  useEffect(() => {
    if (isRecording && timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(t);
    } else if (isRecording && timeLeft === 0) {
      stopRecording();
    }
  }, [isRecording, timeLeft]);

  const startRecording = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (!streamRef.current) return;
    
    const recorder = new MediaRecorder(streamRef.current, { videoBitsPerSecond: 250000 });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      setProcessingVideo(true);
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      chunksRef.current = [];
      let videoUrl: string | null = null;
      let transcriptId: string | null = null;
      try {
        videoUrl = await uploadToCloudinary(blob, 'video');
        transcriptId = await requestTranscription(videoUrl);
      } catch (err) { console.error("Upload error", err); } 

      const idx = state.currentQuestionIndex;
      const isLast = idx >= state.questions.length - 1;
      
      setState(prev => {
         const newVids = [...prev.videoURLs]; newVids[idx] = videoUrl;
         const newTrans = [...prev.transcriptIds]; newTrans[idx] = transcriptId;
         const newAns = [...prev.answers]; newAns[idx] = "Answered";
         return { ...prev, videoURLs: newVids, transcriptIds: newTrans, answers: newAns, currentQuestionIndex: isLast ? idx : idx + 1 };
      });

      setProcessingVideo(false);
      setIsStopping(false);
      if (isLast) {
        // Calculate final stats
        const total = cvDataRef.current.totalFrames || 1;
        const finalStats = {
          eyeContactScore: Math.round((cvDataRef.current.eyeContactFrames / total) * 100),
          confidenceScore: Math.round(cvDataRef.current.confidenceScoreAcc / total),
          facesDetected: cvDataRef.current.facesDetectedMax,
          expressions: cvDataRef.current.expressions
        };
        onFinish(finalStats);
      }
      else {
        setCountdown(5);
        setTimeLeft(QUESTION_TIME_MS / 1000);
      }
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setIsStopping(true);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- ZEN MODE CONTAINER (Hides Navbar via z-index & fixed positioning) ---
  return (
    <div className="fixed inset-0 z-[9999] bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white flex flex-col overflow-hidden transition-colors duration-300">
      
      {/* Header Info - Mobile Friendly */}
      <div className="flex justify-between items-center p-4 z-10 bg-white/5 dark:bg-black/20 backdrop-blur-sm shrink-0 border-b border-gray-200/10">
        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-slate-400 text-[10px] uppercase tracking-widest">Question</span>
          <span className="text-lg font-bold">{state.currentQuestionIndex + 1} <span className="text-gray-400 dark:text-slate-500 text-sm">/ {state.questions.length}</span></span>
        </div>
        
         <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono font-bold text-sm ${timeLeft < 30 ? 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/50 dark:text-red-400 dark:border-red-800' : 'bg-white text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-white dark:border-gray-700'} border shadow-sm`}>
           <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400 dark:bg-gray-500'}`}></div>
           {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
         </div>
      </div>

      {/* Main Video Area - Flex Grow to fill space */}
      <div className="relative flex-1 w-full bg-black overflow-hidden shadow-2xl flex items-center justify-center">
        {processingVideo && <TicTacToe />}
        
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />

        {/* Countdown Overlay */}
        {countdown > 0 && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
             <p className="text-white/90 text-xl font-light mb-2 tracking-widest uppercase">Get Ready</p>
             <span className="text-9xl font-black text-white animate-ping" style={{ animationDuration: '1s' }}>{countdown}</span>
          </div>
        )}
        
        {/* CV Analysis Overlay */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-20 pointer-events-none">
             <div className="bg-black/60 backdrop-blur-md text-green-400 px-2 py-1 rounded text-[10px] font-mono border border-green-500/30 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
               {faceApiReady ? 'AI ACTIVE' : 'INIT...'}
             </div>
             <div className="bg-black/60 backdrop-blur-md text-blue-400 px-2 py-1 rounded text-[10px] font-mono border border-blue-500/30">
               ANALYZING
             </div>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-lg animate-pulse pointer-events-none">
            <span>REC</span>
          </div>
        )}

        {/* Question Overlay (Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pt-20 pointer-events-none">
           <div className="max-w-4xl mx-auto text-center md:text-left">
             <h2 className="text-lg md:text-3xl font-semibold leading-tight text-white drop-shadow-md">{currentQ}</h2>
           </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-gray-800 shrink-0 flex justify-center">
         {isRecording ? (
           <button onClick={stopRecording} className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-red-900/20 transform transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-lg">
             <div className="w-4 h-4 bg-white rounded-sm"></div> Stop & Submit Answer
           </button>
         ) : processingVideo || isStopping ? (
           <div className="text-gray-500 dark:text-gray-400 animate-pulse flex items-center gap-2 py-2">
             <i className="fas fa-circle-notch fa-spin text-xl"></i> <span className="text-lg font-medium">Processing Answer...</span>
           </div>
         ) : (
           <div className="text-gray-500 dark:text-gray-400 text-sm py-2">Waiting for auto-start...</div>
         )}
      </div>
    </div>
  );
};

// --- Submission Screen ---
const InterviewSubmission: React.FC<{
  state: InterviewState;
  tabSwitches: number;
  user: any;
  userProfile: any;
  cvStats: any;
}> = ({ state, tabSwitches, user, userProfile, cvStats }) => {
  const [status, setStatus] = useState("Finalizing transcripts...");
  const navigate = useNavigate();
  const [factIndex, setFactIndex] = useState(0);
  const facts = [
    "The first computer bug was a real moth.", "Symbolics.com was the first domain.", "NASA's internet is 91 GB/s.",
    "The Firefox logo is a red panda.", "Email existed before the Web."
  ];

  useEffect(() => {
    const i = setInterval(() => setFactIndex(p => (p + 1) % facts.length), 4000);
    return () => clearInterval(i);
  }, [facts.length]);

  useEffect(() => {
    const finalize = async () => {
      try {
        setStatus("Fetching transcripts...");
        const transcriptTexts = await Promise.all(
          state.transcriptIds.map(async (id) => {
            if (!id) return "";
            for (let i = 0; i < 10; i++) {
               await new Promise(r => setTimeout(r, 2000));
               const res = await fetchTranscriptText(id);
               if (res.status === 'completed') return res.text!;
               if (res.status === 'error') return "Error";
            }
            return "";
          })
        );
        
        setStatus("AI Analyzing performance...");
        const resp = await fetch(state.candidateResumeURL!);
        const blob = await resp.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64Resume = (reader.result as string).split(',')[1];
            const feedbackRaw = await generateFeedback(
              state.jobTitle, state.jobDescription, `${userProfile.experience} years`, base64Resume, state.candidateResumeMimeType!, state.questions, transcriptTexts
            );
            const parseScore = (regex: RegExp) => (feedbackRaw.match(regex) ? feedbackRaw.match(regex)![1] + "/100" : "N/A");
            
            setStatus("Saving Report...");
            const docRef = await addDoc(collection(db, 'interviews'), {
              ...state, transcriptTexts, feedback: feedbackRaw,
              score: parseScore(/Overall Score:\s*(\d{1,3})/i),
              resumeScore: parseScore(/Resume Score:\s*(\d{1,3})/i),
              qnaScore: parseScore(/Q&A Score:\s*(\d{1,3})/i),
              candidateUID: user.uid, candidateName: userProfile.fullname, candidateEmail: user.email, status: 'Pending', submittedAt: serverTimestamp(), meta: { tabSwitchCount: tabSwitches, cvStats }
            });
            navigate(`/report/${docRef.id}`);
        };
      } catch (err) { setStatus("Error saving. Please contact support."); }
    };
    finalize();
  }, [state, navigate, user, userProfile, tabSwitches, cvStats]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent flex flex-col items-center justify-center p-4">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-green-100 dark:border-gray-800 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-green-500 border-r-green-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <i className="fas fa-check absolute inset-0 flex items-center justify-center text-3xl text-green-500"></i>
      </div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Interview Complete</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-12 animate-pulse">{status}</p>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-lg text-center border border-gray-100 dark:border-gray-700 shadow-xl">
        <p className="text-xs font-bold text-blue-500 uppercase mb-3 tracking-widest">Tech Fact</p>
        <p className="text-gray-700 dark:text-gray-300 italic text-lg transition-all duration-500">"{facts[factIndex]}"</p>
      </div>
    </div>
  );
};

export default InterviewWizard;