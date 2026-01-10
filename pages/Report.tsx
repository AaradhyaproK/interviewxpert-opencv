import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Interview } from '../types';
import { sendNotification } from '../services/notificationService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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

        // Fetch Candidate Profile & Email
        const data = docSnap.data();
        const candidateId = data.candidateUID || data.candidateId || data.userId || data.uid;
        
        if (candidateId) {
          const profileSnap = await getDoc(doc(db, 'profiles', candidateId));
          if (profileSnap.exists()) {
            setProfile(profileSnap.data());
          }
          
          // Try to fetch email from users collection if available
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

  if (loading) return <div className="text-center py-10">Loading report...</div>;
  if (!report) return <div className="text-center py-10">Report not found.</div>;

  const handleStatusChange = async (newStatus: string) => {
    if (!report) return;
    try {
      await updateDoc(doc(db, 'interviews', report.id), {
        status: newStatus
      });

      setReport(prev => prev ? { ...prev, status: newStatus } : null);

      const candidateId = report.candidateUID || (report as any).candidateId || (report as any).userId || (report as any).uid;
      
      if (candidateId) {
        let notificationMessage = `Your application status has been updated to: ${newStatus}`;
        
        switch (newStatus) {
          case 'Hired':
            notificationMessage = `Congratulations! You have been Hired for the position of ${report.jobTitle || 'the job'}.`;
            break;
          case 'Rejected':
            notificationMessage = `Update regarding your application for ${report.jobTitle || 'the job'}. Status: Rejected.`;
            break;
          case 'Interview Scheduled':
            notificationMessage = `Action Required: An interview has been scheduled for ${report.jobTitle || 'the job'}. Check your email.`;
            break;
        }

        await sendNotification(candidateId, notificationMessage, 'status_update', auth.currentUser?.uid, 'Recruiter');
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("Interview Report", 105, 20, { align: "center" });
    
    // Meta Info
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(`Candidate: ${report.candidateName}`, 20, 40);
    doc.text(`Job Title: ${report.jobTitle}`, 20, 50);
    doc.text(`Company: ${companyName}`, 20, 60);
    doc.text(`Date: ${report.submittedAt?.toDate().toLocaleDateString()}`, 20, 70);
    
    // Scores
    doc.text(`Overall Score: ${report.score}`, 20, 90);
    doc.text(`Resume Score: ${report.resumeScore}`, 80, 90);
    doc.text(`Q&A Score: ${report.qnaScore}`, 140, 90);
    
    // Feedback
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("AI Feedback", 20, 110);
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const cleanFeedback = report.feedback.replace(/\*\*/g, '');
    const feedbackLines = doc.splitTextToSize(cleanFeedback, 170);
    doc.text(feedbackLines, 20, 120);
    
    let y = 120 + (feedbackLines.length * 5) + 15;
    
    // Q&A
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Q&A Transcript", 20, y);
    y += 10;
    
    report.questions.forEach((q, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      const qLines = doc.splitTextToSize(`Q${i+1}: ${q}`, 170);
      doc.text(qLines, 20, y);
      y += (qLines.length * 5) + 2;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const aText = report.transcriptTexts[i] || "(No transcription)";
      const aLines = doc.splitTextToSize(aText, 170);
      doc.text(aLines, 20, y);
      y += (aLines.length * 5) + 10;
    });
    
    doc.save(`${report.candidateName.replace(/\s+/g, '_')}_Report.pdf`);
  };

  // Simple parser for the AI Markdown response to HTML
  const formatFeedback = (text: string) => {
    // Very basic replacement for bold headers and newlines
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .split('\n').map((line, i) => <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: line }} />);
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="bg-white dark:bg-black/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary-dark dark:text-blue-400">{report.jobTitle}</h2>
            <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-slate-400">
              <span>Candidate: {report.candidateName}</span>
              <span className="hidden md:inline">|</span>
              <div className="flex items-center gap-2">
                <span>Status:</span>
                {userProfile?.role === 'recruiter' ? (
                <select
                  value={report.status || 'Pending'}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`px-2 py-1 rounded text-xs font-semibold border-0 cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 ${
                      report.status === 'Hired' ? 'bg-teal-100 text-teal-800' : 
                      report.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-600'
                  }`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Reviewing">Reviewing</option>
                  <option value="Interview Scheduled">Interview Scheduled</option>
                  <option value="Hired">Hired</option>
                  <option value="Rejected">Rejected</option>
                </select>
                ) : (
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      report.status === 'Hired' ? 'bg-teal-100 text-teal-800' : 
                      report.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-600'
                  }`}>
                    {report.status || 'Pending'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button 
              onClick={() => setShowProfile(true)}
              className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <i className="fas fa-user-circle"></i> View Profile
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="bg-primary hover:bg-primary-dark dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-md"
            >
              <i className="fas fa-file-download"></i> Download PDF
            </button>
            <button 
              onClick={() => setSelectedResume(report.candidateResumeURL)}
              className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <i className="far fa-file-alt"></i> View Resume
            </button>
          </div>
        </div>

        {/* Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Overall Score */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <i className="fas fa-trophy text-6xl text-blue-500"></i>
          </div>
          <div className="relative z-10">
             <h3 className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Overall Score</h3>
             <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{report.score}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${parseInt(report.score) >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : parseInt(report.score) >= 40 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {parseInt(report.score) >= 70 ? 'Excellent' : parseInt(report.score) >= 40 ? 'Good' : 'Poor'}
                </span>
             </div>
             <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all duration-1000 ${parseInt(report.score) >= 70 ? 'bg-blue-500' : parseInt(report.score) >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${report.score}` }}></div>
             </div>
          </div>
        </div>

        {/* Resume Score */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <i className="fas fa-file-alt text-6xl text-purple-500"></i>
          </div>
          <div className="relative z-10">
             <h3 className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Resume Match</h3>
             <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{report.resumeScore}</span>
             </div>
             <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${report.resumeScore}` }}></div>
             </div>
          </div>
        </div>

        {/* Q&A Score */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <i className="fas fa-comments text-6xl text-orange-500"></i>
          </div>
          <div className="relative z-10">
             <h3 className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Q&A Quality</h3>
             <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{report.qnaScore}</span>
             </div>
             <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${report.qnaScore}` }}></div>
             </div>
          </div>
        </div>
        </div>

        {/* Visual AI Analysis Section */}
        {cvStats && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <i className="fas fa-eye text-blue-500"></i> Visual AI Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Eye Contact */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center">
                <div className="text-sm text-gray-500 dark:text-slate-400 mb-1">Eye Contact</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{cvStats.eyeContactScore}%</div>
                <div className="w-full bg-blue-200 dark:bg-blue-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${cvStats.eyeContactScore}%` }}></div>
                </div>
              </div>

              {/* Confidence */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-center">
                <div className="text-sm text-gray-500 dark:text-slate-400 mb-1">Confidence Score</div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{cvStats.confidenceScore || 85}%</div>
                <div className="w-full bg-purple-200 dark:bg-purple-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${cvStats.confidenceScore || 85}%` }}></div>
                </div>
              </div>

              {/* Person Detection */}
              <div className={`p-4 rounded-xl text-center border ${cvStats.facesDetected > 1 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'}`}>
                <div className="text-sm text-gray-500 dark:text-slate-400 mb-1">Person Detection</div>
                <div className={`text-lg font-bold ${cvStats.facesDetected > 1 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                  {cvStats.facesDetected > 1 ? 'Multiple Faces Detected' : 'Single Face Verified'}
                </div>
                <div className="text-xs mt-1 opacity-70">
                  {cvStats.facesDetected > 1 ? 'Potential integrity violation' : 'Environment secure'}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-2 font-medium">Dominant Expressions:</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(cvStats.expressions || {}).map(([expr, count]: [string, any]) => (
                  <span key={expr} className="px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-full text-xs capitalize text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                    {expr}: {count} frames
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Feedback */}
        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-slate-900 dark:to-black p-6 rounded-xl border border-gray-200 dark:border-slate-800 mb-8 shadow-inner">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <i className="fas fa-brain text-purple-600 dark:text-purple-400"></i> AI Evaluation
          </h3>
          <div className="prose max-w-none text-gray-700 dark:text-slate-300 text-sm">
            {formatFeedback(report.feedback)}
          </div>
        </div>
        
        {/* Integrity Warning */}
        {report.meta && report.meta.tabSwitchCount > 0 && (
           <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-500 p-4 mb-8 rounded-r-lg">
             <div className="flex">
               <div className="flex-shrink-0">
                 <i className="fas fa-exclamation-triangle text-red-500 dark:text-red-400"></i>
               </div>
               <div className="ml-3">
                 <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                   Integrity Warning: The candidate switched tabs <span className="font-bold">{report.meta.tabSwitchCount}</span> time(s) during the interview.
                 </p>
               </div>
             </div>
           </div>
        )}

        {/* Q&A Transcript */}
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Detailed Q&A Transcript</h3>
        <div className="space-y-6">
          {report.questions.map((q, i) => (
            <div key={i} className="border border-gray-100 dark:border-slate-800 rounded-xl p-6 hover:shadow-md transition-shadow bg-white dark:bg-black/40">
              <h4 className="font-semibold text-primary dark:text-blue-400 mb-2">Question {i + 1}</h4>
              <p className="mb-4 italic text-gray-800 dark:text-slate-300">{q}</p>
              
              <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded text-sm text-gray-700 dark:text-slate-300 font-mono whitespace-pre-wrap">
                <span className="font-bold text-xs text-gray-400 dark:text-slate-500 block mb-1">TRANSCRIPT:</span>
                {report.transcriptTexts[i] || "(No transcription available)"}
              </div>

              {report.videoURLs[i] && (
                <div className="mt-4">
                   <button 
                     onClick={() => setSelectedVideo(report.videoURLs[i]!)}
                     className="text-blue-600 hover:underline text-sm flex items-center gap-1 focus:outline-none"
                   >
                     <i className="fas fa-video"></i> Watch Video Response
                   </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center">
        <Link to="/" className="text-gray-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400">Back to Dashboard</Link>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedVideo(null)}>
          <div className="bg-black rounded-lg overflow-hidden max-w-4xl w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 hover:bg-black/70 rounded-full p-2 w-10 h-10 flex items-center justify-center transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
            <video 
              src={selectedVideo} 
              controls 
              autoPlay 
              className="w-full h-auto max-h-[80vh]"
            />
          </div>
        </div>
      )}

      {/* Resume Modal */}
      {selectedResume && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedResume(null)}>
          <div className="bg-white rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh] relative shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b bg-gray-50 dark:bg-slate-900 dark:border-slate-800">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">Candidate Resume</h3>
              <button 
                onClick={() => setSelectedResume(null)}
                className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-slate-800"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center items-start">
               <img src={selectedResume} alt="Resume" className="max-w-full h-auto shadow-md" />
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal (Insta-style) */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setShowProfile(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">Candidate Profile</h3>
              <button onClick={() => setShowProfile(false)} className="text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-6 md:p-8">
              {/* Insta Header Section */}
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-10">
                {/* Avatar */}
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-gray-200 dark:border-slate-700 p-1 flex-shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl text-gray-300 dark:text-slate-600"><i className="fas fa-user"></i></span>
                    )}
                  </div>
                </div>
                
                {/* Info */}
                <div className="flex-1 text-center md:text-left w-full">
                  <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                    <h2 className="text-2xl font-light text-gray-800 dark:text-white">{profile?.displayName || report.candidateName}</h2>
                    {profile?.location && (
                       <span className="text-sm text-gray-500 dark:text-slate-400"><i className="fas fa-map-marker-alt mr-1"></i> {profile.location}</span>
                    )}
                  </div>
                  
                  {/* Stats / Quick Info */}
                  <div className="flex justify-center md:justify-start gap-8 mb-5 text-sm md:text-base border-t border-b border-gray-100 dark:border-slate-800 py-3 md:border-none md:py-0">
                    <div className="text-center md:text-left">
                      <span className="font-bold block md:inline md:mr-1">{profile?.skills ? profile.skills.split(',').length : 0}</span>
                      <span className="text-gray-600 dark:text-slate-400">Skills</span>
                    </div>
                    <div className="text-center md:text-left">
                      <span className="font-bold block md:inline md:mr-1">{profile?.experience ? 'Yes' : 'No'}</span>
                      <span className="text-gray-600 dark:text-slate-400">Experience</span>
                    </div>
                    <div className="text-center md:text-left">
                      <span className="font-bold block md:inline md:mr-1">{report.score}</span>
                      <span className="text-gray-600 dark:text-slate-400">Score</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm md:text-base">
                    <p className="font-semibold text-gray-800 dark:text-white">{profile?.displayName || report.candidateName}</p>
                    <p className="text-gray-600 dark:text-slate-300 whitespace-pre-wrap">{profile?.bio || "No bio available."}</p>
                    
                    {candidateEmail && (
                      <a href={`mailto:${candidateEmail}`} className="text-blue-600 dark:text-blue-400 hover:underline block font-medium mt-1">
                        <i className="far fa-envelope mr-2"></i>{candidateEmail}
                      </a>
                    )}
                    {profile?.phoneNumber && (
                      <p className="text-gray-600 dark:text-slate-400"><i className="fas fa-phone mr-2"></i>{profile.phoneNumber}</p>
                    )}
                    {profile?.portfolio && (
                      <a href={profile.portfolio} target="_blank" rel="noreferrer" className="text-blue-800 dark:text-blue-400 font-medium flex items-center justify-center md:justify-start gap-1 mt-1">
                        <i className="fas fa-link mr-1"></i> {profile.portfolio}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="border-t border-gray-200 dark:border-slate-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                   <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><i className="fas fa-briefcase text-gray-400"></i> Experience</h4>
                   {profile?.experienceList && profile.experienceList.length > 0 ? (
                     <div className="space-y-4">
                       {profile.experienceList.map((exp: any, i: number) => (
                         <div key={i} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
                           <div className="flex justify-between items-baseline mb-1">
                             <h5 className="font-bold text-gray-800 dark:text-white">{exp.role}</h5>
                             <span className="text-xs text-gray-500 dark:text-slate-400">{exp.duration}</span>
                           </div>
                           <div className="text-sm text-primary font-medium mb-2">{exp.company}</div>
                           <p className="text-gray-600 dark:text-slate-300 text-sm whitespace-pre-wrap">{exp.description}</p>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-gray-600 dark:text-slate-300 text-sm whitespace-pre-wrap bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">{profile?.experience || "No experience listed."}</p>
                   )}
                </div>
                <div className="md:col-span-2">
                   <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><i className="fas fa-graduation-cap text-gray-400"></i> Education</h4>
                   {profile?.educationList && profile.educationList.length > 0 ? (
                     <div className="space-y-4">
                       {profile.educationList.map((edu: any, i: number) => (
                         <div key={i} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700 flex justify-between items-center">
                           <div>
                             <h5 className="font-bold text-gray-800 dark:text-white">{edu.school}</h5>
                             <div className="text-sm text-gray-600 dark:text-slate-300">{edu.degree}</div>
                           </div>
                           <span className="text-sm text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-2 py-1 rounded border dark:border-slate-600">{edu.year}</span>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-gray-600 dark:text-slate-300 text-sm whitespace-pre-wrap bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">{profile?.education || "No education listed."}</p>
                   )}
                </div>

                {profile?.projects && profile.projects.length > 0 && (
                  <div className="md:col-span-2">
                    <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><i className="fas fa-project-diagram text-gray-400"></i> Projects</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {profile.projects.map((proj: any, i: number) => (
                        <div key={i} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-bold text-gray-800 dark:text-white">{proj.title}</h5>
                            {proj.link && (
                              <a href={proj.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                View <i className="fas fa-external-link-alt"></i>
                              </a>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-slate-300 text-sm whitespace-pre-wrap">{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile?.certifications && profile.certifications.length > 0 && (
                  <div className="md:col-span-2">
                    <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><i className="fas fa-certificate text-gray-400"></i> Certifications</h4>
                    <div className="space-y-3">
                      {profile.certifications.map((cert: any, i: number) => (
                        <div key={i} className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700 flex justify-between items-center">
                          <div className="font-bold text-gray-800 dark:text-white text-sm">{cert.name}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">{cert.issuer} • {cert.year}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile?.volunteering && profile.volunteering.length > 0 && (
                  <div className="md:col-span-2">
                    <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><i className="fas fa-hands-helping text-gray-400"></i> Volunteering</h4>
                    <div className="space-y-3">
                      {profile.volunteering.map((vol: any, i: number) => (
                        <div key={i} className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                          <div className="flex justify-between items-baseline">
                             <div className="font-bold text-gray-800 dark:text-white text-sm">{vol.role}</div>
                             <div className="text-xs text-gray-500 dark:text-slate-400">{vol.duration}</div>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-slate-300">{vol.organization}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                   <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><i className="fas fa-tools text-gray-400"></i> Skills</h4>
                   <div className="flex flex-wrap gap-2">
                     {profile?.skills ? profile.skills.split(',').map((skill: string, i: number) => (
                       <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">{skill.trim()}</span>
                     )) : <span className="text-gray-500 text-sm">No skills listed.</span>}
                   </div>
                </div>

                {profile?.hobbies && (
                  <div className="md:col-span-2">
                    <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><i className="fas fa-heart text-gray-400"></i> Hobbies & Interests</h4>
                    <p className="text-gray-600 dark:text-slate-300 text-sm bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700">{profile.hobbies}</p>
                  </div>
                )}

                {profile?.customSections && profile.customSections.length > 0 && (
                  <div className="md:col-span-2 space-y-6">
                    {profile.customSections.map((sec: any, i: number) => (
                      <div key={i}>
                        <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><i className="fas fa-star text-gray-400"></i> {sec.title}</h4>
                        <p className="text-gray-600 dark:text-slate-300 text-sm whitespace-pre-wrap bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700">{sec.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {profile?.preferredCategories && (
                  <div className="md:col-span-2">
                    <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><i className="fas fa-layer-group text-gray-400"></i> Preferred Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.preferredCategories.split(',').map((cat: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">{cat.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewReport;