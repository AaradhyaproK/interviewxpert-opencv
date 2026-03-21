import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Interview } from '../types';
import gsap from 'gsap';

const InterviewAccess: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInterview = async () => {
      if (!interviewId) return;
      try {
        const interviewDoc = await getDoc(doc(db, 'interviews', interviewId));
        if (interviewDoc.exists()) {
          setInterview(interviewDoc.data() as Interview);
        } else {
          setError('Interview not found');
        }
      } catch (err) {
        setError('Error fetching interview details');
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [interviewId]);

  useEffect(() => {
    gsap.from('.access-container', { 
        opacity: 0, 
        y: 50, 
        duration: 0.8, 
        ease: 'power3.out' 
    });
  }, []);

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === interview?.accessCode) {
        navigate(`/interview/${interviewId}`);
    } else {
      setError('Invalid access code');
      gsap.fromTo(".access-container", { x: -10 }, { x: 10, repeat: 3, yoyo: true, duration: 0.1, ease: 'power1.inOut', onComplete: () => gsap.to(".access-container", {x: 0}) });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
      <div className="access-container w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Interview</h1>
        {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}
        {interview ? (
            <form onSubmit={handleAccess} className="space-y-6">
                <p className="text-gray-600 dark:text-gray-300">You have been invited to take an interview for the position of <strong>{interview.title}</strong>. Please enter the access code provided to you to start the interview.</p>
                <input
                    type="text"
                    placeholder="Enter Access Code"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                />
                <button 
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-dark text-white dark:text-black font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    Start Interview
                </button>
            </form>
        ) : (
            <p>This interview is no longer available.</p>
        )}
      </div>
    </div>
  );
};

export default InterviewAccess;
