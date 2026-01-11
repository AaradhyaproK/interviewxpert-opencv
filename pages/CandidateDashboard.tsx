import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, Timestamp, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Job, InterviewRequest } from '../types';
import { useNavigate } from 'react-router-dom';
import DashboardCharts from '../components/DashboardCharts';
import { Search, Bell, Mail, Video, Users, FileText, Briefcase, MapPin, DollarSign, Clock, Sparkles, ChevronRight } from 'lucide-react';

const CandidateDashboard: React.FC<{ onlyBestMatches?: boolean }> = ({ onlyBestMatches }) => {
  const { user, userProfile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [requests, setRequests] = useState<Map<string, string>>(new Map()); // jobId -> status
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ shortlisted: 0, hired: 0, rejected: 0 }); // Removed 'total' from here as it comes from requests
  const [activityData, setActivityData] = useState<{ name: string; value: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

    setLoading(true);

    // Real-time: Fetch existing requests (removed orderBy to avoid needing composite index)
    const reqQuery = query(collection(db, 'interviewRequests'), where('candidateUID', '==', user.uid));
    const unsubscribeRequests = onSnapshot(reqQuery, (snapshot) => {
      const reqMap = new Map<string, string>();
      const monthlyCounts: Record<string, number> = {};
      // Helper to generate last 6 months keys if needed, but for "no metadata" we show real data
      // Let's just aggregate existing data

      snapshot.docs.forEach(doc => {
        const data = doc.data() as InterviewRequest;
        reqMap.set(data.jobId, data.status);

        // Aggregate for Chart
        if (data.createdAt) {
          const date = data.createdAt.toDate();
          const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
          monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
        }
      });
      setRequests(reqMap);

      // Convert to array
      const chartData = Object.keys(monthlyCounts).map(month => ({
        name: month,
        value: monthlyCounts[month]
      }));
      // If no data, show empty state or just empty array. 
      // To preserve calendar order, we might ideally sort, but orderBy('createdAt', 'asc') in query helps usage order.
      // However, the keys iteration order isn't guaranteed. 
      // Let's rely on the fact that we process in order (due to query) and insertion order (mostly preserved in modern JS)
      // A robust app would generate the last 6 months array and fill it. 
      // For now, let's map the existing data which is strictly "real".
      setActivityData(chartData);
    });

    // Real-time: Fetch available jobs
    const now = Timestamp.now();
    const jobsQuery = query(collection(db, 'jobs'), where('applyDeadline', '>', now), orderBy('applyDeadline', 'asc'));
    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
      setLoading(false);
    });

    // Real-time: Fetch interview stats
    const intQuery = query(collection(db, 'interviews'), where('candidateUID', '==', user.uid));
    const unsubscribeStats = onSnapshot(intQuery, (snapshot) => {
      let shortlisted = 0, hired = 0, rejected = 0;
      snapshot.docs.forEach(doc => {
        const s = (doc.data().status || '').toLowerCase();
        if (s === 'hired') hired++;
        else if (s === 'rejected') rejected++;
        else if (s === 'shortlisted') shortlisted++;
      });
      setStats({ shortlisted, hired, rejected });
    });

    return () => {
      unsubscribeRequests();
      unsubscribeJobs();
      unsubscribeStats();
    };
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

  // Helper function to get user skills as an array
  const getUserSkills = (): string[] => {
    if (!userProfile) return [];
    const skills = (userProfile as any).skills;
    if (Array.isArray(skills)) {
      return skills.map((s: string) => s.toLowerCase().trim());
    }
    if (typeof skills === 'string') {
      return skills.split(',').map((s: string) => s.toLowerCase().trim()).filter(Boolean);
    }
    return [];
  };

  // Best Matches: Filter jobs based on user skills matching job qualifications
  const bestMatches = jobs.filter(job => {
    if ((job as any).isMock) return false;
    const userSkills = getUserSkills();
    if (userSkills.length === 0) return false;
    const jobQuals = (job.qualifications || '').toLowerCase();
    const jobTitle = (job.title || '').toLowerCase();
    const jobDescription = ((job as any).description || '').toLowerCase();
    return userSkills.some((skill: string) =>
      jobQuals.includes(skill) || jobTitle.includes(skill) || jobDescription.includes(skill)
    );
  });

  // All jobs (non-mock)
  const allJobs = jobs.filter(job => !(job as any).isMock);

  // Filter by search term
  const filterBySearch = (jobList: Job[]) => {
    const term = searchTerm.toLowerCase();
    if (!term) return jobList;
    return jobList.filter(job => {
      const titleMatch = (job.title || '').toLowerCase().includes(term);
      const companyMatch = (job.companyName || '').toLowerCase().includes(term);
      return titleMatch || companyMatch;
    });
  };

  const filteredAllJobs = filterBySearch(allJobs);
  const filteredBestMatches = filterBySearch(bestMatches);

  if (loading) return <div className="text-center py-20 text-gray-500 animate-pulse">Loading dashboard...</div>;

  // Visual Components with Light Mode Support
  const MetricCard = ({ icon: Icon, label, value, colorClass, percent }: any) => (
    <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none relative overflow-hidden group hover:border-gray-200 dark:hover:border-white/10 transition-colors">
      <div className={`p-3 rounded-lg w-fit mb-4 ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <div className="absolute top-6 right-6 px-2 py-1 rounded bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 text-xs font-bold">
        {percent}
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
    </div>
  );

  // Job Card Render Function
  const renderJobCard = (job: Job) => {
    const requestStatus = requests.get(job.id);
    return (
      <div key={job.id} onClick={() => setSelectedJob(job)} className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-blue-500/30 dark:hover:border-white/10 transition-all cursor-pointer group hover:-translate-y-1 duration-300 shadow-sm dark:shadow-none hover:shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-xl font-bold text-blue-600 dark:text-blue-500 border border-blue-100 dark:border-blue-500/20">
            {job.companyName.charAt(0)}
          </div>
          <span className="bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-[#888] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide border border-gray-200 dark:border-white/5">
            {(job as any).jobType || 'FULL TIME'}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{job.title}</h3>
        <p className="text-gray-500 dark:text-gray-500 text-sm mb-6 flex items-center gap-1.5">
          {job.companyName} • <span className="text-gray-600 dark:text-gray-600">{(job as any).location || 'Remote'}</span>
        </p>

        <div className="flex items-center justify-between mt-auto">
          <p className="text-gray-900 dark:text-white font-bold text-sm">{(job as any).salaryRange || 'Competitive'}</p>

          {/* Action Buttons */}
          {requestStatus === 'pending' ? (
            <button disabled className="px-4 py-2 bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-500 border border-yellow-100 dark:border-yellow-500/20 rounded-lg text-sm font-bold">
              Pending
            </button>
          ) : requestStatus === 'accepted' || job.interviewPermission === 'anyone' ? (
            <button onClick={(e) => { e.stopPropagation(); handleStartInterview(job.id); }} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-green-900/20">
              Start
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); openApplyModal(job); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-900/20">
              Apply
            </button>
          )}
        </div>
      </div>
    );
  };

  // ===== BEST MATCHES ONLY MODE =====
  if (onlyBestMatches) {
    const displayedMatches = filteredBestMatches.length > 0 ? filteredBestMatches : allJobs;
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white font-sans selection:bg-blue-500/30">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">

          {/* Header with Search */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Best Matches</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Jobs tailored to your skills</p>
              </div>
            </div>

            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all shadow-sm dark:shadow-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Jobs Grid */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Jobs Matching Your Skills
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {displayedMatches.length} job{displayedMatches.length !== 1 ? 's' : ''} found
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedMatches.map(job => renderJobCard(job))}
            </div>
          </div>
        </div>

        {/* Modals */}
        {renderJobModal()}
        {renderApplyModal()}
      </div>
    );
  }

  // ===== FULL DASHBOARD MODE =====
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Welcome & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {userProfile?.fullname?.split(' ')[0] || 'User'}</h1>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-96">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Find your job..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all shadow-sm dark:shadow-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2.5 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-400 shadow-sm dark:shadow-none">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2.5 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-400 shadow-sm dark:shadow-none">
              <Mail className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            icon={FileText}
            label="Total Applications"
            value={requests.size}
            colorClass="bg-blue-500 text-blue-500"
            percent=""
          />
          <MetricCard
            icon={Users}
            label="Total Hired"
            value={stats.hired}
            colorClass="bg-green-500 text-green-500"
            percent=""
          />
          <MetricCard
            icon={Video}
            label="Active Interviews"
            value={stats.shortlisted}
            colorClass="bg-orange-500 text-orange-500"
            percent=""
          />
        </div>

        {/* Charts Section */}
        <DashboardCharts stats={{ ...stats, total: requests.size }} activityData={activityData} />

        {/* Best Matches Row */}
        {filteredBestMatches.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Best Matches</h2>
              </div>
              <button
                onClick={() => navigate('/candidate/best-matches')}
                className="flex items-center gap-1 text-blue-600 dark:text-blue-500 text-sm font-bold hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                VIEW ALL <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBestMatches.slice(0, 3).map(job => renderJobCard(job))}
            </div>
          </div>
        )}

        {/* All Jobs Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Available Jobs</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredAllJobs.length} job{filteredAllJobs.length !== 1 ? 's' : ''} available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAllJobs.map(job => renderJobCard(job))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {renderJobModal()}
      {renderApplyModal()}
    </div>
  );

  // Job Details Modal
  function renderJobModal() {
    if (!selectedJob) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-md" onClick={() => setSelectedJob(null)}>
        <div className="bg-white dark:bg-[#0f0f0f] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-white/10" onClick={e => e.stopPropagation()}>
          {/* Modal Header with Cover Image */}
          <div className="h-32 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/40 dark:to-purple-900/40 relative">
            <button onClick={() => setSelectedJob(null)} className="absolute top-4 right-4 bg-white/50 dark:bg-black/40 hover:bg-white/80 dark:hover:bg-black/60 text-gray-900 dark:text-white rounded-full p-2 transition-colors">
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="px-8 pb-8 -mt-10 relative">
            <div className="flex justify-between items-end mb-6">
              <div className="flex gap-5 items-end">
                <div className="w-20 h-20 bg-white dark:bg-[#1a1a1a] rounded-xl border-4 border-white dark:border-[#0f0f0f] shadow-lg flex items-center justify-center text-3xl font-bold text-gray-500 dark:text-gray-400">
                  {selectedJob.companyName.charAt(0)}
                </div>
                <div className="mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedJob.title}</h2>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                    <Briefcase className="w-4 h-4" /> {selectedJob.companyName}
                    <span>•</span>
                    <MapPin className="w-4 h-4" /> {(selectedJob as any).location || 'Remote'}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mb-2">
                {/* Action Buttons */}
                {requests.get(selectedJob.id) === 'pending' ? (
                  <div className="px-5 py-2.5 bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400 rounded-xl font-medium border border-yellow-100 dark:border-yellow-500/20 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Pending
                  </div>
                ) : requests.get(selectedJob.id) === 'accepted' || selectedJob.interviewPermission === 'anyone' ? (
                  <button onClick={() => handleStartInterview(selectedJob.id)} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 transition-all flex items-center gap-2">
                    <span className="text-lg">▶</span> Start Interview
                  </button>
                ) : (
                  <button onClick={() => openApplyModal(selectedJob)} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2">
                    Apply Now
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 dark:bg-[#161616] p-4 rounded-xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-1">
                  <DollarSign className="w-3.5 h-3.5" /> Salary
                </div>
                <div className="text-gray-900 dark:text-white font-medium">{(selectedJob as any).salaryRange || 'Not disclosed'}</div>
              </div>
              <div className="bg-gray-50 dark:bg-[#161616] p-4 rounded-xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-1">
                  <Briefcase className="w-3.5 h-3.5" /> Job Type
                </div>
                <div className="text-gray-900 dark:text-white font-medium">{(selectedJob as any).jobType || 'Full-time'}</div>
              </div>
              <div className="bg-gray-50 dark:bg-[#161616] p-4 rounded-xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-1">
                  <Clock className="w-3.5 h-3.5" /> Deadline
                </div>
                <div className="text-gray-900 dark:text-white font-medium">{selectedJob.applyDeadline?.toDate ? selectedJob.applyDeadline.toDate().toLocaleDateString() : 'Open'}</div>
              </div>
            </div>

            <div className="space-y-6 text-gray-600 dark:text-gray-300">
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-3">About the Role</h3>
                <p className="leading-relaxed whitespace-pre-wrap text-sm text-gray-500 dark:text-gray-400">
                  {(selectedJob as any).description || 'No detailed description provided.'}
                </p>
              </div>

              <div>
                <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-3">Requirements</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.qualifications?.split(',').map((q, i) => (
                    <span key={i} className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-lg text-sm border border-gray-200 dark:border-white/5">
                      {q.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Apply Modal
  function renderApplyModal() {
    if (!applyModal.isOpen || !applyModal.job) return null;
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-100 dark:border-white/10">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Apply for {applyModal.job.title}</h3>
          <p className="text-sm text-gray-500 mb-6">
            Share your profile with {applyModal.job.companyName}.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Notice Period</label>
              <input
                type="text"
                placeholder="e.g. Immediate"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                value={applicationData.noticePeriod}
                onChange={e => setApplicationData({ ...applicationData, noticePeriod: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Expected Salary</label>
              <input
                type="text"
                placeholder="e.g. $80k"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                value={applicationData.expectedSalary}
                onChange={e => setApplicationData({ ...applicationData, expectedSalary: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setApplyModal({ isOpen: false, job: null })} className="px-5 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl font-medium transition-colors">Cancel</button>
            <button onClick={submitApplication} disabled={submitting} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/30 disabled:opacity-50">
              {submitting ? 'Sending...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default CandidateDashboard;