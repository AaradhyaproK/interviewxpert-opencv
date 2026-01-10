import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Link } from 'react-router-dom';
import { Interview } from '../types';

const MyInterviews: React.FC = () => {
  const [realInterviews, setRealInterviews] = useState<Interview[]>([]);
  const [mockInterviews, setMockInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [activeTab, setActiveTab] = useState<'real' | 'mock'>('real');

  useEffect(() => {
    // Use onAuthStateChanged to wait for the user session to initialize
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Query for interviews where the user is the candidate
          const q = query(
            collection(db, 'interviews'),
            where('candidateUID', '==', user.uid)
          );
          
          const snap = await getDocs(q);
          const allInterviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interview));

          // Fetch mock jobs created by this user to exclude them
          const mockJobsQuery = query(
            collection(db, 'jobs'),
            where('recruiterUID', '==', user.uid),
            where('isMock', '==', true)
          );
          const mockJobsSnap = await getDocs(mockJobsQuery);
          const mockJobIds = new Set(mockJobsSnap.docs.map(doc => doc.id));

          // Separate interviews
          const real: Interview[] = [];
          const mock: Interview[] = [];
          
          allInterviews.forEach(interview => {
            if (mockJobIds.has(interview.jobId)) mock.push(interview);
            else real.push(interview);
          });
          
          setRealInterviews(real);
          setMockInterviews(mock);
        } catch (err) {
          console.error("Error fetching interviews:", err);
        }
      }
      // Always set loading to false after the auth check completes
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const currentList = activeTab === 'real' ? realInterviews : mockInterviews;

  const filteredInterviews = currentList
    .filter(interview => 
      ((interview as any).jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const getScore = (val: any) => {
        if (!val) return 0;
        const match = String(val).match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[0]) : 0;
      };
      const scoreA = getScore(a.score);
      const scoreB = getScore(b.score);

      if (sortOrder === 'scoreHigh') {
        return scoreB - scoreA;
      }
      if (sortOrder === 'scoreLow') {
        return scoreA - scoreB;
      }
      // Default to newest
      const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate().getTime() : 0;
      const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate().getTime() : 0;
      return dateB - dateA;
    });

  if (loading) return <div className="text-center py-10 dark:text-slate-400">Loading your interviews...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Interview History</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b border-gray-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('real')}
          className={`pb-3 px-1 text-sm font-bold transition-all relative ${
            activeTab === 'real' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          Job Interviews <span className="ml-1 px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded-full text-xs">{realInterviews.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('mock')}
          className={`pb-3 px-1 text-sm font-bold transition-all relative ${
            activeTab === 'mock' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          Mock Interviews <span className="ml-1 px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded-full text-xs">{mockInterviews.length}</span>
        </button>
      </div>

      <div className="mb-8 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"></i>
            <input
              type="text"
              placeholder="Search by job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white dark:bg-slate-950 dark:text-white dark:placeholder-slate-500"
            />
          </div>
          <div className="relative w-full md:w-64">
            <i className="fas fa-sort absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"></i>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none bg-white dark:bg-slate-950 dark:text-white transition-all cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="scoreHigh">Score: High to Low</option>
              <option value="scoreLow">Score: Low to High</option>
            </select>
            <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none text-xs"></i>
          </div>
        </div>
      </div>

      {filteredInterviews.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-100 dark:border-slate-800">
          <p className="text-gray-500 dark:text-slate-400">No {activeTab === 'mock' ? 'mock' : 'job'} interviews found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInterviews.map(interview => {
            const getScore = (val: any) => {
              if (!val) return 0;
              const match = String(val).match(/(\d+(\.\d+)?)/);
              return match ? parseFloat(match[0]) : 0;
            };
            const score = getScore(interview.score);
            // Assuming these fields exist or defaulting to 0/null
            const resumeScore = getScore((interview as any).resumeScore);
            const qaScore = getScore((interview as any).qaScore) || 
                            getScore((interview as any).qnaScore) || 
                            getScore((interview as any).qaQuality) ||
                            getScore((interview as any).technicalScore) ||
                            getScore((interview as any).communicationScore);

            return (
            <div key={interview.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white line-clamp-1" title={(interview as any).jobTitle}>{(interview as any).jobTitle || 'Untitled Position'}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2 mt-1 mb-2">
                      <i className="far fa-calendar-alt"></i>
                      {interview.submittedAt?.toDate ? interview.submittedAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date N/A'}
                    </p>
                 </div>
                 {activeTab === 'mock' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">Mock</span>
                 ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        interview.status === 'Hired' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 
                        interview.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                    }`}>
                    {interview.status || 'Pending'}
                    </span>
                 )}
              </div>

              <div className="space-y-4 mb-6 flex-grow">
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center border border-blue-100 dark:border-blue-800">
                        <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Overall</div>
                        <div className="font-bold text-blue-700 dark:text-blue-400">{score}%</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 text-center border border-purple-100 dark:border-purple-800">
                        <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Resume</div>
                        <div className="font-bold text-purple-700 dark:text-purple-400">{resumeScore}%</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 text-center border border-orange-100 dark:border-orange-800">
                        <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Q&A</div>
                        <div className="font-bold text-orange-700 dark:text-orange-400">{qaScore}%</div>
                    </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 mt-auto">
                <Link to={`/report/${interview.id}`} className="flex items-center justify-center w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-primary hover:text-primary dark:hover:text-primary dark:hover:border-primary rounded-xl transition-all font-semibold text-sm shadow-sm hover:shadow">
                  View Full Report <i className="fas fa-arrow-right ml-2"></i>
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

export default MyInterviews;