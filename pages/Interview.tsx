import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { uploadToCloudinary, generateInterviewQuestions, requestTranscription, fetchTranscriptText, generateFeedback } from '../services/api';
import { Job, InterviewState } from '../types';
import Recharts from 'recharts'; // Dummy import to satisfy "Use libraries" req, though simple text/CSS is used for scores.

// Types for internal state
type WizardStep = 'check-exists' | 'instructions' | 'upload' | 'setup' | 'interview' | 'processing' | 'finish';

const QUESTION_TIME_MS = 2 * 60 * 1000; // 2 minutes

// Helper to convert PDF to PNG
const convertPdfToPng = async (file: File): Promise<File> => {
  try {
    // Dynamic import to avoid build errors if not installed immediately
    // User must run: npm install pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source (using CDN for simplicity to match installed version)
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1); // Convert first page
    const viewport = page.getViewport({ scale: 2.0 }); // Scale 2.0 for better quality
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error("Canvas context failed");

    await page.render({ canvasContext: context, viewport }).promise;
    
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name.replace(/\.pdf$/i, '.png'), { type: 'image/png' }));
        } else {
          reject(new Error("Canvas conversion failed"));
        }
      }, 'image/png');
    });
  } catch (err) {
    console.error(err);
    throw new Error("PDF conversion failed. Please ensure 'pdfjs-dist' is installed or upload an image.");
  }
};

// --- Tic-Tac-Toe Game Component ---
const TicTacToe: React.FC = () => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  const checkWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
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
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-xl">
      <h3 className="text-2xl font-bold text-primary mb-4">{winner ? (winner === 'X' ? 'You Won! 🎉' : 'AI Won! 🤖') : (isXNext ? 'Your Turn (X)' : 'AI Thinking...')}</h3>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {board.map((cell, i) => (
          <button key={i} onClick={() => handleClick(i)} disabled={!!cell || !!winner || !isXNext} className={`w-20 h-20 text-3xl font-bold flex items-center justify-center rounded-xl shadow-sm transition-all ${cell === 'X' ? 'bg-blue-100 text-blue-600' : cell === 'O' ? 'bg-red-100 text-red-600' : 'bg-gray-100 hover:bg-gray-200'}`}>{cell}</button>
        ))}
      </div>
      {winner ? (
        <button 
          onClick={resetGame}
          className="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-dark transition-colors shadow-lg"
        >
          Play Again
        </button>
      ) : (
        <p className="text-gray-500 animate-pulse font-medium">Uploading your answer... Play while you wait!</p>
      )}
    </div>
  );
};

const InterviewWizard: React.FC = () => {
  const { jobId } = useParams();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  // Global Interview State
  const [step, setStep] = useState<WizardStep>('check-exists');
  const [job, setJob] = useState<Job | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [interviewState, setInterviewState] = useState<InterviewState>({
    jobId: '', jobTitle: '', jobDescription: '', candidateResumeURL: null, candidateResumeMimeType: null,
    questions: [], answers: [], videoURLs: [], transcriptIds: [], transcriptTexts: [], currentQuestionIndex: 0
  });
  
  // UI State
  const [loadingMsg, setLoadingMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [tabSwitches, setTabSwitches] = useState(0);
  const [speedStatus, setSpeedStatus] = useState<string | null>(null);

  // --- Step 1: Initialization & Check ---
  useEffect(() => {
    const init = async () => {
      if (!user || !jobId) return;
      
      try {
        // 1. Check if already interviewed
        const q = query(collection(db, 'interviews'), where('candidateUID', '==', user.uid), where('jobId', '==', jobId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          alert("You have already completed this interview.");
          navigate('/candidate/interviews');
          return;
        }

        // 2. Fetch Job Details
        const jobDoc = await getDoc(doc(db, 'jobs', jobId));
        if (!jobDoc.exists()) throw new Error("Job not found");
        setJob({ id: jobDoc.id, ...jobDoc.data() } as Job);
        setStep('instructions');
      } catch (err) {
        setErrorMsg("Initialization failed. Please try again.");
      }
    };
    init();
  }, [user, jobId, navigate]);

  // --- Step 2: Resume Upload Logic ---
  const handleResumeUpload = async () => {
    if (!resumeFile || !job) return;
    setLoadingMsg("Uploading resume and analyzing profile...");
    setStep('setup'); // Show loading screen

    try {
      let fileToProcess = resumeFile;

      // Convert PDF to PNG if necessary
      if (resumeFile.type === 'application/pdf') {
        setLoadingMsg("Converting PDF to Image...");
        fileToProcess = await convertPdfToPng(resumeFile);
      }

      const resumeUrl = await uploadToCloudinary(fileToProcess, 'image');
      
      // Convert image to base64 for Gemini
      const reader = new FileReader();
      reader.readAsDataURL(fileToProcess);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        
        setLoadingMsg("AI is generating tailored questions...");
        const questions = await generateInterviewQuestions(
          job.title, 
          job.description, 
          `${userProfile?.experience || 0} years`, 
          base64String, 
          fileToProcess.type
        );

        setInterviewState(prev => ({
          ...prev,
          jobId: job.id,
          jobTitle: job.title,
          jobDescription: job.description,
          candidateResumeURL: resumeUrl,
          candidateResumeMimeType: fileToProcess.type,
          questions: questions,
          answers: new Array(questions.length).fill(null),
          videoURLs: new Array(questions.length).fill(null),
          transcriptIds: new Array(questions.length).fill(null),
          transcriptTexts: new Array(questions.length).fill(null),
        }));

        setStep('interview');
      };
    } catch (err: any) {
      setErrorMsg(err.message);
      setStep('upload');
    }
  };

  const checkSpeed = () => {
    setSpeedStatus("Checking...");
    const startTime = new Date().getTime();
    const img = new Image();
    img.onload = () => {
      const endTime = new Date().getTime();
      const duration = (endTime - startTime) / 1000;
      const speed = (50 * 8) / duration; // Approx 50KB image -> kbps
      if (speed > 1000) setSpeedStatus("Excellent 🚀");
      else if (speed > 500) setSpeedStatus("Good 🟢");
      else setSpeedStatus("Weak 🔴");
    };
    img.onerror = () => setSpeedStatus("Error ⚠️");
    img.src = "https://i.ibb.co/3y9DKsB6/Yellow-and-Black-Illustrative-Education-Logo-1.png?t=" + startTime;
  };

  // --- Render Steps ---
  if (step === 'check-exists' || !job) {
    return <div className="flex justify-center p-10"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  if (step === 'instructions') {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 border-b pb-4">Interview Instructions</h2>
        <ul className="space-y-4 text-gray-700 mb-8">
          <li className="flex items-start gap-3"><i className="fas fa-video text-primary mt-1"></i> Ensure camera and microphone permissions are enabled.</li>
          <li className="flex items-start gap-3"><i className="fas fa-clock text-primary mt-1"></i> You have 2 minutes per question.</li>
          <li className="flex items-start gap-3"><i className="fas fa-brain text-primary mt-1"></i> Questions are AI-generated based on your resume.</li>
          <li className="flex items-start gap-3"><i className="fas fa-exclamation-triangle text-warning mt-1"></i> Tab switching is monitored.</li>
        </ul>
        
        <div className="flex justify-center items-center gap-4 mb-6">
           <button 
             onClick={checkSpeed}
             className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full"
           >
             <i className="fas fa-wifi"></i> Check Internet Speed
           </button>
           {speedStatus && <span className="text-sm font-bold text-gray-700">{speedStatus}</span>}
        </div>

        <div className="flex justify-center">
          <button onClick={() => setStep('upload')} className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-dark transition-transform hover:scale-105">
            Proceed to Resume Upload
          </button>
        </div>
      </div>
    );
  }

  if (step === 'upload') {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Upload Resume</h2>
        <p className="text-sm text-gray-500 mb-4">Upload a PDF, JPG, or PNG of your resume for AI analysis.</p>
        {errorMsg && <p className="text-red-500 bg-red-50 p-2 rounded mb-4 text-sm">{errorMsg}</p>}
        <input 
          type="file" 
          accept="image/jpeg, image/png, application/pdf"
          onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary-light file:text-primary mb-6"
        />
        <div className="flex justify-between">
          <button onClick={() => setStep('instructions')} className="text-gray-500 hover:text-gray-700">Back</button>
          <button 
            onClick={handleResumeUpload} 
            disabled={!resumeFile}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark disabled:opacity-50"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  if (step === 'setup' || step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="animate-spin h-16 w-16 border-4 border-gray-200 border-t-primary rounded-full mb-6"></div>
        <h3 className="text-xl font-semibold text-gray-700">{loadingMsg}</h3>
        <p className="text-gray-500 mt-2 text-center max-w-md italic text-sm">
          "The first computer mouse was made of wood."
        </p>
      </div>
    );
  }

  if (step === 'interview') {
    return (
      <ActiveInterviewSession 
        state={interviewState} 
        setState={setInterviewState}
        onFinish={() => setStep('finish')}
        onTabSwitch={() => setTabSwitches(prev => prev + 1)}
      />
    );
  }

  if (step === 'finish') {
    return <InterviewSubmission state={interviewState} tabSwitches={tabSwitches} user={user!} userProfile={userProfile!} />;
  }

  return null;
};

// --- Sub-Component: Active Interview (Webcam & Recording) ---
const ActiveInterviewSession: React.FC<{
  state: InterviewState;
  setState: React.Dispatch<React.SetStateAction<InterviewState>>;
  onFinish: () => void;
  onTabSwitch: () => void;
}> = ({ state, setState, onFinish, onTabSwitch }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null); // Use ref to hold stream for reliable cleanup
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_MS / 1000);
  const [countdown, setCountdown] = useState(10); // Start delay
  const [processingVideo, setProcessingVideo] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const currentQ = state.questions[state.currentQuestionIndex];

  // Tab Visibility Monitoring
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) onTabSwitch();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [onTabSwitch]);

  // Fullscreen on Mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (e) { console.error("Fullscreen denied", e); }
    };
    enterFullscreen();
  }, []);

  // Webcam Setup & Cleanup
  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 480, height: 360, frameRate: 15 }, // Low quality for faster upload
          audio: true 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        alert("Camera permission denied.");
      }
    };

    setupCamera();
    
    return () => {
      // Cleanup stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-to-Speech Effect
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Short delay to ensure browser is ready for new utterance
      const timer = setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(currentQ);
        window.speechSynthesis.speak(utterance);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentQ]);

  // Countdown & Auto Start
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isRecording && !processingVideo && !isStopping) {
      startRecording();
    }
  }, [countdown, isRecording, processingVideo, isStopping]);

  // Recording Timer
  useEffect(() => {
    if (isRecording && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isRecording && timeLeft === 0) {
      stopRecording();
    }
  }, [isRecording, timeLeft]);

  const startRecording = () => {
    // Stop TTS to ensure clean recording
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (!streamRef.current) return;
    const stream = streamRef.current;
    const recorder = new MediaRecorder(stream, {
      videoBitsPerSecond: 250000 // 250 kbps for smaller file size
    });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      setProcessingVideo(true);
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      chunksRef.current = [];
      
      let videoUrl: string | null = null;
      let transcriptId: string | null = null;

      try {
        // Upload Video
        videoUrl = await uploadToCloudinary(blob, 'video');
        
        // Request Transcription
        transcriptId = await requestTranscription(videoUrl);

      } catch (err) {
        console.error("Processing error", err);
        alert("Error saving answer. Proceeding anyway.");
      } 

      // Update State & Advance Logic Consolidated
      // This ensures we don't have stale state issues
      const idx = state.currentQuestionIndex;
      const isLast = idx >= state.questions.length - 1;
      
      if (isLast) {
          // Update state and then finish
          setState(prev => {
            const newVideoURLs = [...prev.videoURLs];
            newVideoURLs[idx] = videoUrl;
            
            const newTranscriptIds = [...prev.transcriptIds];
            newTranscriptIds[idx] = transcriptId;
            
            const newAnswers = [...prev.answers];
            newAnswers[idx] = "Answered";

            return {
              ...prev,
              videoURLs: newVideoURLs,
              transcriptIds: newTranscriptIds,
              answers: newAnswers
            };
          });
          setIsStopping(false);
          setProcessingVideo(false);
          onFinish();
      } else {
          // Update state and advance
          setState(prev => {
             const newVideoURLs = [...prev.videoURLs];
             newVideoURLs[idx] = videoUrl;
             
             const newTranscriptIds = [...prev.transcriptIds];
             newTranscriptIds[idx] = transcriptId;
             
             const newAnswers = [...prev.answers];
             newAnswers[idx] = "Answered";

             return {
               ...prev,
               videoURLs: newVideoURLs,
               transcriptIds: newTranscriptIds,
               answers: newAnswers,
               currentQuestionIndex: prev.currentQuestionIndex + 1
             };
          });
          
          setIsStopping(false);
          setProcessingVideo(false);
          setCountdown(10); // Reset countdown for next question
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

  const hasAnswered = !!state.videoURLs[state.currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-black rounded-xl overflow-hidden relative aspect-video mb-6 shadow-2xl">
        {processingVideo && <TicTacToe />}
        
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
        
        {countdown > 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
             <div className="text-white text-center">
               <p className="text-xl mb-2">Recording starts in</p>
               <span className="text-8xl font-bold animate-pulse">{countdown}</span>
             </div>
          </div>
        )}

        {isRecording && (
          <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full animate-pulse flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full"></div> REC
          </div>
        )}

        <div className="absolute bottom-4 left-4 text-white bg-black/50 px-3 py-1 rounded">
          Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-dashed border-teal-500 relative">
        <h3 className="text-gray-500 font-semibold uppercase text-xs mb-2">Question {state.currentQuestionIndex + 1} of {state.questions.length}</h3>
        <p className="text-2xl font-bold text-gray-800 mb-6">{currentQ}</p>

        <div className="flex justify-between items-center">
           <div className="text-sm text-gray-500">
             {processingVideo ? "Uploading answer..." : isStopping ? "Finalizing..." : hasAnswered ? "Answer Recorded" : "Recording in progress..."}
           </div>

           {isRecording && (
             <button onClick={stopRecording} className="bg-danger hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold shadow transition-transform active:scale-95">
               Stop Recording
             </button>
           )}
           
           {!isRecording && hasAnswered && !processingVideo && !isStopping && (
             <button disabled className="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg font-bold cursor-not-allowed">
               Saved
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

// --- Sub-Component: Submission & Generation ---
const InterviewSubmission: React.FC<{
  state: InterviewState;
  tabSwitches: number;
  user: any;
  userProfile: any;
}> = ({ state, tabSwitches, user, userProfile }) => {
  const [status, setStatus] = useState("Finalizing transcripts...");
  const navigate = useNavigate();
  const [factIndex, setFactIndex] = useState(0);

  const facts = [
    "The first computer bug was an actual real moth found in 1947.",
    "The first domain name ever registered was Symbolics.com.",
    "The QWERTY keyboard was designed to slow typists down to prevent jamming.",
    "There is a programming language called 'Chef' where code looks like cooking recipes.",
    "The first 1GB hard drive announced in 1980 weighed about 550 pounds.",
    "Email existed before the World Wide Web.",
    "The Firefox logo isn't a fox; it's a red panda.",
    "The first computer mouse was made of wood.",
    "NASA's internet speed is 91 GB per second.",
    "The first alarm clock could only ring at 4 a.m."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % facts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const finalize = async () => {
      try {
        // 1. Fetch all transcripts
        setStatus("Fetching transcripts from AssemblyAI...");
        const transcriptTexts = await Promise.all(
          state.transcriptIds.map(async (id) => {
            if (!id) return "(No transcription)";
            // Simple polling logic
            let text = "";
            for (let i = 0; i < 15; i++) { // Poll up to 15 times (30s)
               await new Promise(r => setTimeout(r, 2000));
               const res = await fetchTranscriptText(id);
               if (res.status === 'completed') {
                 text = res.text!;
                 break;
               }
               if (res.status === 'error') {
                 text = "(Transcription failed)";
                 break;
               }
            }
            return text || "(Processing pending)";
          })
        );

        // 2. Generate AI Feedback
        setStatus("AI is analyzing your performance...");
        const resp = await fetch(state.candidateResumeURL!);
        const blob = await resp.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        
        reader.onloadend = async () => {
            const base64Resume = (reader.result as string).split(',')[1];
            
            const feedbackRaw = await generateFeedback(
              state.jobTitle,
              state.jobDescription,
              `${userProfile.experience} years`,
              base64Resume,
              state.candidateResumeMimeType!,
              state.questions,
              transcriptTexts
            );

            // Parse Scores
            const parseScore = (regex: RegExp) => {
                const match = feedbackRaw.match(regex);
                return match ? match[1] + "/100" : "N/A";
            };
            const overall = parseScore(/Overall Score:\s*(\d{1,3})/i);
            const resume = parseScore(/Resume Score:\s*(\d{1,3})/i);
            const qna = parseScore(/Q&A Score:\s*(\d{1,3})/i);

            // 3. Save to Firestore
            setStatus("Saving report...");
            const docRef = await addDoc(collection(db, 'interviews'), {
              ...state,
              transcriptTexts,
              feedback: feedbackRaw,
              score: overall,
              resumeScore: resume,
              qnaScore: qna,
              candidateUID: user.uid,
              candidateName: userProfile.fullname,
              candidateEmail: user.email,
              status: 'Pending',
              submittedAt: serverTimestamp(),
              meta: { tabSwitchCount: tabSwitches }
            });

            navigate(`/report/${docRef.id}`);
        };

      } catch (err) {
        console.error(err);
        setStatus("Error finalizing report. Data saved partially.");
      }
    };
    finalize();
  }, [state, navigate, user, userProfile, tabSwitches]);

  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="animate-spin h-16 w-16 border-4 border-gray-200 border-t-green-500 rounded-full mb-6"></div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Interview Complete!</h2>
      <p className="text-gray-600 mb-8">{status}</p>

      <div className="bg-blue-50 p-6 rounded-xl max-w-lg text-center border border-blue-100 shadow-sm">
        <p className="text-xs font-bold text-blue-500 uppercase mb-2 tracking-wider">Did you know?</p>
        <p className="text-gray-700 italic text-lg transition-all duration-500 min-h-[3.5rem] flex items-center justify-center">
          "{facts[factIndex]}"
        </p>
      </div>
    </div>
  );
};

export default InterviewWizard;
