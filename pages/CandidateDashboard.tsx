import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Job, InterviewRequest } from '../types';
import { useNavigate } from 'react-router-dom';

const CandidateDashboard: React.FC<{ onlyBestMatches?: boolean }> = ({ onlyBestMatches }) => {
  const { user, userProfile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [requests, setRequests] = useState<Map<string, string>>(new Map()); // jobId -> status
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, shortlisted: 0, hired: 0, rejected: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyModal, setApplyModal] = useState<{ isOpen: boolean; job: Job | null }>({ isOpen: false, job: null });
  const [applicationData, setApplicationData] = useState({
    noticePeriod: '',
    expectedSalary: '',
    coverNote: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch existing requests
        const reqQuery = query(collection(db, 'interviewRequests'), where('candidateUID', '==', user.uid));
        const reqSnap = await getDocs(reqQuery);
        const reqMap = new Map<string, string>();
        reqSnap.forEach(doc => {
          const data = doc.data() as InterviewRequest;
          reqMap.set(data.jobId, data.status);
        });
        setRequests(reqMap);

        // Fetch available jobs
        const now = Timestamp.now();
        const jobsQuery = query(collection(db, 'jobs'), where('applyDeadline', '>', now), orderBy('applyDeadline', 'asc'));
        const jobSnap = await getDocs(jobsQuery);
        setJobs(jobSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));

        // Fetch interview stats
        const intQuery = query(collection(db, 'interviews'), where('candidateUID', '==', user.uid));
        const intSnap = await getDocs(intQuery);
        let total = 0, shortlisted = 0, hired = 0, rejected = 0;
        
        intSnap.forEach(doc => {
          total++;
          const s = (doc.data().status || '').toLowerCase();
          if (s === 'hired') hired++;
          else if (s === 'rejected') rejected++;
          else if (s === 'shortlisted') shortlisted++;
        });
        setStats({ total, shortlisted, hired, rejected });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const openApplyModal = (job: Job) => {
    setApplyModal({ isOpen: true, job });
  };

  const submitApplication = async () => {
    const job = applyModal.job;
    if (!user || !userProfile) return;
    if (!job) return;

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'interviewRequests'), {
        jobId: job.id,
        jobTitle: job.title,
        candidateUID: user.uid,
        candidateName: userProfile.fullname,
        recruiterUID: job.recruiterUID,
        status: 'pending',
        noticePeriod: applicationData.noticePeriod,
        expectedSalary: applicationData.expectedSalary,
        coverNote: applicationData.coverNote,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setRequests(new Map(requests.set(job.id, 'pending')));
      setApplyModal({ isOpen: false, job: null });
      setApplicationData({ noticePeriod: '', expectedSalary: '', coverNote: '' });
      alert("Application sent successfully! Your profile has been shared with the recruiter.");
    } catch (err) {
      alert("Error sending request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartInterview = (jobId: string) => {
    navigate(`/interview/${jobId}`);
  };

  const filteredJobs = jobs.filter(job => {
    const term = searchTerm.toLowerCase();
    const skill = skillFilter.toLowerCase();
    const titleMatch = (job.title || '').toLowerCase().includes(term);
    const companyMatch = (job.companyName || '').toLowerCase().includes(term);
    const skillMatch = (job.qualifications || '').toLowerCase().includes(skill);
    const isNotMock = !(job as any).isMock;
    
    return (titleMatch || companyMatch) && skillMatch && isNotMock;
  }).sort((a, b) => {
    const dateA = a.applyDeadline?.toDate ? a.applyDeadline.toDate().getTime() : 0;
    const dateB = b.applyDeadline?.toDate ? b.applyDeadline.toDate().getTime() : 0;
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const bestMatches = jobs.filter(job => {
    if ((job as any).isMock) return false;
    if (!userProfile || !(userProfile as any).skills || !Array.isArray((userProfile as any).skills)) return false;
    const jobQuals = (job.qualifications || '').toLowerCase();
    return (userProfile as any).skills.some((skill: string) => jobQuals.includes(skill.toLowerCase()));
  });

  // Fallback: If no best matches found, show 1 random job
  let displayedMatches = bestMatches;
  let isFallback = false;
  if (onlyBestMatches && bestMatches.length === 0 && jobs.length > 0) {
    displayedMatches = [jobs[Math.floor(Math.random() * jobs.length)]];
    isFallback = true;
  }

  if (loading) return <div className="text-center py-10 dark:text-slate-400">Loading opportunities...</div>;

  return (
    <div>
      {!onlyBestMatches && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-shadow flex flex-col items-start">
          <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3"><i className="fas fa-clipboard-list"></i></div>
          <h3 className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Interviews</h3>
          <p className="text-3xl font-extrabold text-gray-800 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-shadow flex flex-col items-start">
          <div className="h-10 w-10 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center mb-3"><i className="fas fa-star"></i></div>
          <h3 className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Shortlisted</h3>
          <p className="text-3xl font-extrabold text-gray-800 dark:text-white mt-1">{stats.shortlisted}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-shadow flex flex-col items-start">
          <div className="h-10 w-10 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-3"><i className="fas fa-check-circle"></i></div>
          <h3 className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Hired</h3>
          <p className="text-3xl font-extrabold text-gray-800 dark:text-white mt-1">{stats.hired}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-shadow flex flex-col items-start">
          <div className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-3"><i className="fas fa-times-circle"></i></div>
          <h3 className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Rejected</h3>
          <p className="text-3xl font-extrabold text-gray-800 dark:text-white mt-1">{stats.rejected}</p>
        </div>
      </div>
      )}

      {onlyBestMatches && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <i className="fas fa-star text-yellow-500"></i> Your Best Matches
          </h2>
          {isFallback && (
            <p className="text-gray-500 dark:text-slate-400 mb-4 text-sm">
              No exact skill matches found. Here is a recommended opportunity for you:
            </p>
          )}
          {displayedMatches.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800">
              <p className="text-gray-500 dark:text-slate-400">No jobs available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedMatches.map(job => {
              const requestStatus = requests.get(job.id);
              return (
                <div key={job.id} className="group relative h-full">
                  {/* Golden Glow Border */}
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 rounded-2xl opacity-60 blur-sm group-hover:opacity-100 group-hover:blur-md transition-all duration-500"></div>
                  
                  <div className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col h-full hover:shadow-xl transition-all duration-300">
                    
                    {/* Card Header - Left Aligned */}
                    <div className="mb-5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-12 h-12 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center text-2xl shadow-sm border border-yellow-100 dark:border-yellow-800">
                           <span className="text-2xl">⭐</span>
                        </div>
                        {job.interviewPermission === 'request' && (
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                            Request
                          </span>
                        )}
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors mb-1">{job.title}</h3>
                         <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 flex items-center gap-2">
                           <i className="fas fa-building text-gray-400"></i> {job.companyName}
                         </p>
                      </div>
                    </div>
                    
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-5">
                       <span className="px-2.5 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-lg border border-yellow-100 dark:border-yellow-800 flex items-center gap-1">
                         <i className="fas fa-check-circle text-[10px]"></i> Best Match
                       </span>
                       <span className="px-2.5 py-1 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs font-medium rounded-lg border border-gray-100 dark:border-slate-700">
                         <i className="far fa-clock mr-1"></i> {job.applyDeadline?.toDate ? job.applyDeadline.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A'}
                       </span>
                    </div>
                    
                    {/* Content */}
                    <div className="mb-6 flex-grow">
                       <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Qualifications</p>
                       <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-3 leading-relaxed font-medium">{job.qualifications}</p>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center gap-3">
                      <button 
                        onClick={() => setSelectedJob(job)}
                        className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white text-sm font-bold transition-colors"
                      >
                        View Details
                      </button>

                      {requestStatus === 'pending' ? (
                        <button disabled className="flex-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-4 py-2.5 rounded-xl text-sm font-bold cursor-not-allowed border border-yellow-100 dark:border-yellow-800">
                          Pending
                        </button>
                      ) : requestStatus === 'accepted' || job.interviewPermission === 'anyone' ? (
                      <button 
                        onClick={() => handleStartInterview(job.id)}
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-play text-xs"></i> Start Now
                      </button>
                    ) : (
                      <button 
                        onClick={() => openApplyModal(job)}
                        className="flex-1 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow"
                      >
                        Request Access
                      </button>
                    )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

      {!onlyBestMatches && (
      <>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 px-1">Available Opportunities</h2>
      
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-3 text-gray-400 dark:text-slate-500"></i>
            <input 
              type="text" 
              placeholder="Search Job Title or Company..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-md focus:ring-primary focus:border-primary bg-white dark:bg-slate-950 dark:text-white dark:placeholder-slate-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <i className="fas fa-tools absolute left-3 top-3 text-gray-400 dark:text-slate-500"></i>
            <input 
              type="text" 
              placeholder="Filter by Skills (e.g. React)..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-md focus:ring-primary focus:border-primary bg-white dark:bg-slate-950 dark:text-white dark:placeholder-slate-500"
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
            />
          </div>
          <div className="relative">
             <i className="far fa-calendar-alt absolute left-3 top-3 text-gray-400 dark:text-slate-500"></i>
             <select 
               className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-md focus:ring-primary focus:border-primary appearance-none bg-white dark:bg-slate-950 dark:text-white cursor-pointer"
               value={sortOrder}
               onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
             >
               <option value="asc" className="bg-white dark:bg-slate-950">Deadline: Earliest First</option>
               <option value="desc" className="bg-white dark:bg-slate-950">Deadline: Latest First</option>
             </select>
          </div>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-lg dark:text-slate-400">
           {jobs.length === 0 ? "No active job postings found." : "No jobs match your search filters."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map(job => {
            const requestStatus = requests.get(job.id);
            
            return (
              <div key={job.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-primary">{job.title}</h3>
                  {job.interviewPermission === 'request' && (
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded border border-blue-100 dark:border-blue-800">
                      Request Required
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-2"><i className="fas fa-building mr-1"></i> {job.companyName}</p>
                <p className="text-sm text-gray-500 dark:text-slate-500 mb-4">
                  Deadline: {job.applyDeadline?.toDate ? job.applyDeadline.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                </p>
                
                <div className="mb-4">
                   <p className="text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wide">Qualifications</p>
                   <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2">{job.qualifications}</p>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 dark:border-slate-800 flex justify-end gap-2">
                  <button 
                    onClick={() => setSelectedJob(job)}
                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-primary hover:border-primary dark:hover:text-primary dark:hover:border-primary px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>

                  {requestStatus === 'pending' ? (
                    <button disabled className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-4 py-2 rounded text-sm font-medium cursor-not-allowed">
                      <i className="fas fa-hourglass-half mr-2"></i> Request Pending
                    </button>
                  ) : requestStatus === 'accepted' || job.interviewPermission === 'anyone' ? (
                    <button 
                      onClick={() => handleStartInterview(job.id)}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg"
                    >
                      <i className="fas fa-play mr-2"></i> Start Interview
                    </button>
                  ) : (
                    <button 
                      onClick={() => openApplyModal(job)}
                      className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-md"
                    >
                      <i className="fas fa-hand-paper mr-2"></i> Request Permission
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedJob(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedJob.title}</h2>
                <p className="text-gray-600 dark:text-slate-400 font-medium"><i className="fas fa-building mr-2"></i>{selectedJob.companyName}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-white transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                      <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Location</p>
                      <p className="font-medium text-gray-800 dark:text-white">{(selectedJob as any).location || 'Remote / Not Specified'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                      <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Salary Range</p>
                      <p className="font-medium text-gray-800 dark:text-white">{(selectedJob as any).salaryRange || 'Not Disclosed'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                      <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Job Type</p>
                      <p className="font-medium text-gray-800 dark:text-white">{(selectedJob as any).jobType || 'Full-time'}</p>
                  </div>
                   <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                      <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Deadline</p>
                      <p className="font-medium text-gray-800 dark:text-white">{selectedJob.applyDeadline?.toDate ? selectedJob.applyDeadline.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Open until filled'}</p>
                  </div>
              </div>

              <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Job Description</h3>
                  <div className="text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {(selectedJob as any).description || 'No detailed description provided for this position.'}
                  </div>
              </div>

              <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Required Qualifications</h3>
                  <div className="flex flex-wrap gap-2">
                      {selectedJob.qualifications?.split(',').map((skill, idx) => (
                          <span key={idx} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium border border-blue-100 dark:border-blue-800">
                              {skill.trim()}
                          </span>
                      )) || <span className="text-gray-500 dark:text-slate-400">No specific qualifications listed.</span>}
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {applyModal.isOpen && applyModal.job && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Apply for {applyModal.job.title}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
              Your complete profile will be shared with {applyModal.job.companyName}. Please provide additional details below.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Notice Period</label>
                <input 
                  type="text" 
                  placeholder="e.g. Immediate, 30 days" 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                  value={applicationData.noticePeriod}
                  onChange={e => setApplicationData({...applicationData, noticePeriod: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Expected Salary</label>
                <input 
                  type="text" 
                  placeholder="e.g. $80,000/yr" 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                  value={applicationData.expectedSalary}
                  onChange={e => setApplicationData({...applicationData, expectedSalary: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setApplyModal({ isOpen: false, job: null })} className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={submitApplication} disabled={submitting} className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30 disabled:opacity-70">{submitting ? 'Sending...' : 'Submit Application'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard;