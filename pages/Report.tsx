import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Interview } from '../types';
import { sendNotification } from '../services/notificationService';
import { jsPDF } from 'jspdf';
import { useAuth } from '../context/AuthContext';

const InterviewReport: React.FC = () => {
  const { interviewId } = useParams();
  const { userProfile } = useAuth();
  const [report, setReport] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [candidateEmail, setCandidateEmail] = useState('');
  const [cvStats, setCvStats] = useState<any>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!interviewId) return;
      const docSnap = await getDoc(doc(db, 'interviews', interviewId));
      if (docSnap.exists()) {
        setReport({ id: docSnap.id, ...docSnap.data() } as Interview);

        if (docSnap.data().jobId) {
          const jobSnap = await getDoc(doc(db, 'jobs', docSnap.data().jobId));
          if (jobSnap.exists()) {
            setCompanyName(jobSnap.data().companyName);
          }
        }

        if (docSnap.data().meta && docSnap.data().meta.cvStats) {
          setCvStats(docSnap.data().meta.cvStats);
        }

        const data = docSnap.data();
        const candidateId = data.candidateUID || data.candidateId || data.userId || data.uid;

        if (candidateId) {
          const profileSnap = await getDoc(doc(db, 'profiles', candidateId));
          if (profileSnap.exists()) {
            setProfile(profileSnap.data());
          }

          const userSnap = await getDoc(doc(db, 'users', candidateId));
          if (userSnap.exists()) {
            setCandidateEmail(userSnap.data().email);
          } else if (data.candidateEmail) {
            setCandidateEmail(data.candidateEmail);
          }
        }
      }
      setLoading(false);
    };
    fetchReport();
  }, [interviewId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  );

  if (!report) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
      Report not found.
    </div>
  );

  const handleStatusChange = async (newStatus: string) => {
    if (!report) return;
    try {
      await updateDoc(doc(db, 'interviews', report.id), { status: newStatus });
      setReport(prev => prev ? { ...prev, status: newStatus } : null);

      const candidateId = report.candidateUID || (report as any).candidateId || (report as any).userId || (report as any).uid;
      if (candidateId) {
        let notificationMessage = `Your application status has been updated to: ${newStatus}`;
        switch (newStatus) {
          case 'Hired': notificationMessage = `Congratulations! You have been Hired for ${report.jobTitle || 'the position'}.`; break;
          case 'Rejected': notificationMessage = `Update regarding your application for ${report.jobTitle || 'the position'}. Status: Rejected.`; break;
          case 'Interview Scheduled': notificationMessage = `Action Required: Interview scheduled for ${report.jobTitle}.`; break;
        }
        await sendNotification(candidateId, notificationMessage, 'status_update', auth.currentUser?.uid, 'Recruiter');
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Interview Report", 20, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 32);

    doc.setDrawColor(200);
    doc.line(20, 40, 190, 40);

    doc.setFontSize(12);
    doc.text(`Candidate: ${report.candidateName}`, 20, 50);
    doc.text(`Job Title: ${report.jobTitle}`, 20, 58);
    doc.text(`Company: ${companyName}`, 20, 66);

    // Scores
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Scores", 20, 85);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Overall Score: ${report.score}`, 20, 95);
    doc.text(`Resume Score: ${report.resumeScore}`, 70, 95);
    doc.text(`Q&A Score: ${report.qnaScore}`, 120, 95);

    // Feedback
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("AI Feedback", 20, 115);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const cleanFeedback = report.feedback.replace(/\*\*/g, '');
    const feedbackLines = doc.splitTextToSize(cleanFeedback, 170);
    doc.text(feedbackLines, 20, 125);

    let y = 125 + (feedbackLines.length * 5) + 15;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Interview Transcript", 20, y);
    y += 10;

    report.questions.forEach((q, i) => {
      if (y > 270) { doc.addPage(); y = 20; }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      const qLines = doc.splitTextToSize(`Q${i + 1}: ${q}`, 170);
      doc.text(qLines, 20, y);
      y += (qLines.length * 5) + 3;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const aText = report.transcriptTexts[i] || "(No transcription)";
      const aLines = doc.splitTextToSize(aText, 170);
      doc.text(aLines, 20, y);
      y += (aLines.length * 5) + 8;
    });

    doc.save(`${report.candidateName.replace(/\s+/g, '_')}_Report.pdf`);
  };

  const formatFeedback = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .split('\n').map((line, i) => <p key={i} className="mb-3 text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: line }} />);
  };

  const scoreColor = (score: string | number) => {
    const s = parseInt(score.toString());
    if (s >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (s >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  const scoreBarColor = (score: string | number) => {
    const s = parseInt(score.toString());
    if (s >= 75) return 'bg-emerald-500';
    if (s >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-gray-900 pb-20">
      {/* Navbar / Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-400 hover:text-gray-900 transition-colors">
              <i className="fas fa-arrow-left text-lg"></i>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">{report.jobTitle}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-medium">{report.candidateName}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span>{companyName || 'Interview Report'}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span>{report.submittedAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userProfile?.role === 'recruiter' && (
              <select
                value={report.status || 'Pending'}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`text-sm font-medium border-none pl-3 pr-8 py-2 rounded-lg cursor-pointer outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-gray-900 hover:bg-gray-50 transition-all appearance-none bg-no-repeat bg-[right_0.75rem_center]`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
              >
                <option value="Pending">Pending</option>
                <option value="Reviewing">Reviewing</option>
                <option value="Interview Scheduled">Scheduled</option>
                <option value="Hired">Hired</option>
                <option value="Rejected">Rejected</option>
              </select>
            )}

            <button onClick={() => setShowProfile(true)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all" title="View Profile">
              <i className="far fa-user-circle text-xl"></i>
            </button>
            <button onClick={handleDownloadPDF} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all" title="Download PDF">
              <i className="far fa-file-pdf text-xl"></i>
            </button>
            {report.candidateResumeURL && (
              <button onClick={() => setSelectedResume(report.candidateResumeURL)} className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-lg shadow-sm transition-all">
                View Resume
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Overall Score', value: report.score, icon: 'fa-chart-pie' },
            { label: 'Resume Match', value: report.resumeScore, icon: 'fa-file-contract' },
            { label: 'Q&A Quality', value: report.qnaScore, icon: 'fa-comments' }
          ].map((metric, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{metric.label}</h3>
                <i className={`fas ${metric.icon} text-gray-300`}></i>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold tracking-tighter text-gray-900">{metric.value}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide border ${scoreColor(metric.value)}`}>
                  {parseInt(metric.value.toString()) >= 70 ? 'Excellent' : parseInt(metric.value.toString()) >= 40 ? 'Good' : 'Poor'}
                </span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-6 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${scoreBarColor(metric.value)}`} style={{ width: `${metric.value}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Visual Analysis (if available) - Redesigned */}
        {cvStats && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <i className="fas fa-eye text-sm"></i>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Visual Intelligence Analysis</h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2 font-medium">Eye Contact</div>
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center text-2xl font-bold text-gray-900">
                    <svg className="w-full h-full absolute top-0 left-0 transform -rotate-90">
                      <circle cx="50%" cy="50%" r="45%" stroke="#f3f4f6" strokeWidth="6" fill="transparent" />
                      <circle cx="50%" cy="50%" r="45%" stroke="#3b82f6" strokeWidth="6" fill="transparent" strokeDasharray={`${(cvStats.eyeContactScore / 100) * 283} 283`} strokeLinecap="round" />
                    </svg>
                    {cvStats.eyeContactScore}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2 font-medium">Confidence</div>
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center text-2xl font-bold text-gray-900">
                    <svg className="w-full h-full absolute top-0 left-0 transform -rotate-90">
                      <circle cx="50%" cy="50%" r="45%" stroke="#f3f4f6" strokeWidth="6" fill="transparent" />
                      <circle cx="50%" cy="50%" r="45%" stroke="#8b5cf6" strokeWidth="6" fill="transparent" strokeDasharray={`${((cvStats.confidenceScore || 85) / 100) * 283} 283`} strokeLinecap="round" />
                    </svg>
                    {cvStats.confidenceScore || 85}%
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="text-sm text-gray-500 mb-2 font-medium">Environment Check</div>
                  <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${cvStats.facesDetected > 1 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                    <i className={`fas ${cvStats.facesDetected > 1 ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>
                    <span className="font-semibold text-sm">{cvStats.facesDetected > 1 ? 'Multiple Faces' : 'Secure Environment'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Detected Expressions</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(cvStats.expressions || {}).map(([expr, count]: [string, any]) => (
                    <span key={expr} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-md text-xs border border-gray-100 font-medium capitalize">
                      {expr} <span className="text-gray-400 ml-1">({count})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Feedback - Document Style */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
          <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-3">
              <i className="fas fa-magic text-purple-600"></i> AI Evaluation Report
            </h2>
          </div>
          <div className="p-8 md:p-10 font-serif leading-relaxed text-lg text-gray-700">
            {formatFeedback(report.feedback)}
          </div>
        </div>

        {/* Q&A Transcript - Minimalist List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900">Interview Transcript</h2>
            <span className="text-sm text-gray-500">{report.questions.length} Questions</span>
          </div>

          <div className="grid gap-6">
            {report.questions.map((q, i) => (
              <div key={i} className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{q}</h3>
                    <div className="relative pl-4 border-l-2 border-gray-100 group-hover:border-blue-500/30 transition-colors">
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-r-lg rounded-bl-lg">
                        {report.transcriptTexts[i] || <span className="text-gray-400 italic">No audio transcription available.</span>}
                      </p>
                    </div>
                    {report.videoURLs[i] && (
                      <button
                        onClick={() => setSelectedVideo(report.videoURLs[i]!)}
                        className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <i className="fas fa-play-circle text-lg"></i> Watch Response
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integrity Warning Footer */}
        {report.meta && report.meta.tabSwitchCount > 0 && (
          <div className="max-w-xl mx-auto mt-12 text-center p-6 bg-red-50 rounded-xl border border-red-100">
            <i className="fas fa-shield-alt text-red-400 text-2xl mb-2"></i>
            <h4 className="text-red-800 font-bold mb-1">Integrity Note</h4>
            <p className="text-red-600 text-sm">
              The candidate switched tabs <span className="font-bold">{report.meta.tabSwitchCount}</span> time(s) during the session.
            </p>
          </div>
        )}

      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setSelectedVideo(null)}>
          <div className="bg-black rounded-2xl overflow-hidden max-w-5xl w-full shadow-2xl ring-1 ring-gray-200" onClick={e => e.stopPropagation()}>
            <video src={selectedVideo} controls autoPlay className="w-full h-auto max-h-[85vh]" />
          </div>
          <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors">
            <i className="fas fa-times text-3xl"></i>
          </button>
        </div>
      )}

      {/* Resume Modal */}
      {selectedResume && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedResume(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-gray-900">Parsed Resume</h3>
              <button onClick={() => setSelectedResume(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-8 flex justify-center">
              <img src={selectedResume} alt="Resume" className="max-w-full h-auto shadow-lg ring-1 ring-gray-900/5" />
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center sm:p-6" onClick={() => setShowProfile(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <h3 className="font-bold text-lg text-gray-900">Candidate Profile</h3>
              <button onClick={() => setShowProfile(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-8 text-center border-b border-gray-100">
              <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-3xl mb-4 overflow-hidden border-4 border-white shadow-sm ring-1 ring-gray-100">
                {profile?.photoURL ? <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <i className="fas fa-user"></i>}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile?.displayName || report.candidateName}</h2>
              <div className="text-gray-500 text-sm mb-4">{profile?.location || "Location not specified"}</div>

              <div className="flex justify-center gap-4 text-sm">
                {candidateEmail && <a href={`mailto:${candidateEmail}`} className="text-blue-600 hover:underline"><i className="far fa-envelope mr-1"></i> Email</a>}
                {profile?.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline"><i className="fab fa-linkedin mr-1"></i> LinkedIn</a>}
                {profile?.portfolio && <a href={profile.portfolio} target="_blank" rel="noreferrer" className="text-gray-700 hover:underline"><i className="fas fa-globe mr-1"></i> Portfolio</a>}
              </div>
            </div>

            <div className="p-8 space-y-8">
              {profile?.bio && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">About</h4>
                  <p className="text-gray-600 leading-relaxed text-sm">{profile.bio}</p>
                </div>
              )}

              {profile?.skills && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.split(',').map((s: string) => (
                      <span key={s} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">{s.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InterviewReport;