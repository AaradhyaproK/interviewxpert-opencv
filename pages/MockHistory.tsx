import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Link } from 'react-router-dom';
import { Interview } from '../types';

const MockHistory: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // 1. Get all jobs created by this user that are mocks
          const jobsQuery = query(
            collection(db, 'jobs'),
            where('recruiterUID', '==', user.uid),
            where('isMock', '==', true)
          );
          const jobsSnap = await getDocs(jobsQuery);
          const mockJobIds = jobsSnap.docs.map(doc => doc.id);

          if (mockJobIds.length === 0) {
            setInterviews([]);
            setLoading(false);
            return;
          }

          // 2. Get interviews for these jobs
          // Note: Firestore 'in' query is limited to 10 items. If user has many mock jobs, we might need to batch or fetch all user interviews and filter in memory.
          // For scalability, fetching all user interviews and filtering is safer here since a user won't have millions of interviews.
          
          const interviewsQuery = query(
            collection(db, 'interviews'),
            where('candidateUID', '==', user.uid),
            orderBy('submittedAt', 'desc')
          );
          
          const interviewsSnap = await getDocs(interviewsQuery);
          const allInterviews = interviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interview));
          
          // Filter for mock jobs
          const mockInterviews = allInterviews.filter(i => mockJobIds.includes(i.jobId));
          setInterviews(mockInterviews);

        } catch (err) {
          console.error("Error fetching mock history:", err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredInterviews = interviews.filter(interview => 
    ((interview as any).jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center py-10 dark:text-slate-400">Loading mock history...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Mock Interview History</h2>
        <Link to="/candidate/mock-interview" className="w-full sm:w-auto text-center bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg shadow transition-colors text-sm font-medium">
          <i className="fas fa-plus mr-2"></i> New Mock Interview
        </Link>
      </div>

      <div className="mb-8 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"></i>
          <input
            type="text"
            placeholder="Search by job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white dark:bg-slate-950 dark:text-white dark:placeholder-slate-500"
          />
        </div>
      </div>

      {filteredInterviews.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 dark:text-blue-400 text-2xl">
            <i className="fas fa-history"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">No Mock Interviews Yet</h3>
          <p className="text-gray-500 dark:text-slate-400 mb-6">Start practicing to see your history here.</p>
          <Link to="/candidate/mock-interview" className="text-primary font-medium hover:underline">Start a Mock Interview</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInterviews.map(interview => {
            const score = parseInt(interview.score) || 0;
            const resumeScore = parseInt((interview as any).resumeScore) || 0;
            const qnaScore = parseInt((interview as any).qnaScore) || 0;

            return (
              <div key={interview.id} className="group bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-300 flex flex-col relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          Mock
                        </span>
                        <span className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                          <i className="far fa-calendar-alt"></i>
                          {interview.submittedAt?.toDate ? interview.submittedAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date N/A'}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white line-clamp-1 group-hover:text-primary transition-colors" title={(interview as any).jobTitle}>
                        {(interview as any).jobTitle || 'Untitled Mock'}
                      </h3>
                   </div>
                   
                   <div className="flex flex-col items-end">
                     <div className={`text-2xl font-black ${
                     score >= 70 ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20' :
                     score >= 40 ? 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' :
                     'text-red-500'
                   }`}>
                     {score}
                   </div>
                     <span className="text-[10px] text-gray-400 uppercase font-bold">Score</span>
                   </div>
                </div>

                <div className="space-y-3 mb-6 flex-grow relative z-10">
                  <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2">
                    {(interview as any).jobDescription || 'No description provided.'}
                  </p>
                  
                  {/* Mini stats */}
                  <div className="flex gap-2 mt-3">
                    <div className="flex-1 bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500 dark:text-slate-400">Resume</div>
                      <div className="font-bold text-gray-800 dark:text-white">{resumeScore}%</div>
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500 dark:text-slate-400">Q&A</div>
                      <div className="font-bold text-gray-800 dark:text-white">{qnaScore}%</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 mt-auto relative z-10">
                  <Link to={`/report/${interview.id}`} className="flex items-center justify-center w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-primary hover:text-white hover:border-primary dark:hover:bg-primary dark:hover:border-primary rounded-xl transition-all font-semibold text-sm group-hover:shadow-md">
                    View Analysis <i className="fas fa-chart-pie ml-2"></i>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MockHistory;