import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Interview } from '../types';
import { sendNotification } from '../services/notificationService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';

const ScoreCircle: React.FC<{ score: string; label: string }> = ({ score, label }) => {
  const value = parseInt(score) || 0;
  const data = [{ value }, { value: 100 - value }];
  
  let color = '#28a745'; // success
  if (value < 50) color = '#dc3545';
  else if (value < 75) color = '#ffc107';

  return (
    <div className="flex flex-col items-center">
      <div className="h-32 w-32 relative">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} innerRadius={35} outerRadius={50} startAngle={90} endAngle={-270} dataKey="value">
              <Cell fill={color} />
              <Cell fill="#e9ecef" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-700">{score}</span>
        </div>
      </div>
      <span className="mt-2 font-medium text-gray-600">{label}</span>
    </div>
  );
};

const InterviewReport: React.FC = () => {
  const { interviewId } = useParams();
  const [report, setReport] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [candidateEmail, setCandidateEmail] = useState('');

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
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary-dark">{report.jobTitle}</h2>
            <div className="flex items-center gap-2 mt-1 text-gray-500">
              <span>Candidate: {report.candidateName}</span>
              <span className="hidden md:inline">|</span>
              <div className="flex items-center gap-2">
                <span>Status:</span>
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
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button 
              onClick={() => setShowProfile(true)}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <i className="fas fa-user-circle"></i> View Profile
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-md"
            >
              <i className="fas fa-file-download"></i> Download PDF
            </button>
            <button 
              onClick={() => setSelectedResume(report.candidateResumeURL)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <i className="far fa-file-alt"></i> View Resume
            </button>
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <ScoreCircle score={report.score} label="Overall Score" />
          <ScoreCircle score={report.resumeScore} label="Resume Match" />
          <ScoreCircle score={report.qnaScore} label="Q&A Quality" />
        </div>

        {/* AI Feedback */}
        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 mb-8 shadow-inner">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-brain text-purple-600"></i> AI Evaluation
          </h3>
          <div className="prose max-w-none text-gray-700 text-sm">
            {formatFeedback(report.feedback)}
          </div>
        </div>
        
        {/* Integrity Warning */}
        {report.meta && report.meta.tabSwitchCount > 0 && (
           <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg">
             <div className="flex">
               <div className="flex-shrink-0">
                 <i className="fas fa-exclamation-triangle text-red-500"></i>
               </div>
               <div className="ml-3">
                 <p className="text-sm text-red-700">
                   Integrity Warning: The candidate switched tabs {report.meta.tabSwitchCount} time(s) during the interview.
                 </p>
               </div>
             </div>
           </div>
        )}

        {/* Q&A Transcript */}
        <h3 className="text-xl font-bold text-gray-800 mb-6">Detailed Q&A Transcript</h3>
        <div className="space-y-6">
          {report.questions.map((q, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow bg-white">
              <h4 className="font-semibold text-primary mb-2">Question {i + 1}</h4>
              <p className="mb-4 italic text-gray-800">{q}</p>
              
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 font-mono whitespace-pre-wrap">
                <span className="font-bold text-xs text-gray-400 block mb-1">TRANSCRIPT:</span>
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
        <Link to="/" className="text-gray-500 hover:text-primary">Back to Dashboard</Link>
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
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Candidate Resume</h3>
              <button 
                onClick={() => setSelectedResume(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
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
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-bold text-lg text-gray-800">Candidate Profile</h3>
              <button onClick={() => setShowProfile(false)} className="text-gray-500 hover:text-gray-800 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-6 md:p-8">
              {/* Insta Header Section */}
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-10">
                {/* Avatar */}
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-gray-200 p-1 flex-shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl text-gray-300"><i className="fas fa-user"></i></span>
                    )}
                  </div>
                </div>
                
                {/* Info */}
                <div className="flex-1 text-center md:text-left w-full">
                  <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                    <h2 className="text-2xl font-light text-gray-800">{profile?.displayName || report.candidateName}</h2>
                    {profile?.location && (
                       <span className="text-sm text-gray-500"><i className="fas fa-map-marker-alt mr-1"></i> {profile.location}</span>
                    )}
                  </div>
                  
                  {/* Stats / Quick Info */}
                  <div className="flex justify-center md:justify-start gap-8 mb-5 text-sm md:text-base border-t border-b border-gray-100 py-3 md:border-none md:py-0">
                    <div className="text-center md:text-left">
                      <span className="font-bold block md:inline md:mr-1">{profile?.skills ? profile.skills.split(',').length : 0}</span>
                      <span className="text-gray-600">Skills</span>
                    </div>
                    <div className="text-center md:text-left">
                      <span className="font-bold block md:inline md:mr-1">{profile?.experience ? 'Yes' : 'No'}</span>
                      <span className="text-gray-600">Experience</span>
                    </div>
                    <div className="text-center md:text-left">
                      <span className="font-bold block md:inline md:mr-1">{report.score}</span>
                      <span className="text-gray-600">Score</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm md:text-base">
                    <p className="font-semibold text-gray-800">{profile?.displayName || report.candidateName}</p>
                    <p className="text-gray-600 whitespace-pre-wrap">{profile?.bio || "No bio available."}</p>
                    
                    {candidateEmail && (
                      <a href={`mailto:${candidateEmail}`} className="text-blue-600 hover:underline block font-medium mt-1">
                        <i className="far fa-envelope mr-2"></i>{candidateEmail}
                      </a>
                    )}
                    {profile?.phoneNumber && (
                      <p className="text-gray-600"><i className="fas fa-phone mr-2"></i>{profile.phoneNumber}</p>
                    )}
                    {profile?.portfolio && (
                      <a href={profile.portfolio} target="_blank" rel="noreferrer" className="text-blue-800 font-medium flex items-center justify-center md:justify-start gap-1 mt-1">
                        <i className="fas fa-link mr-1"></i> {profile.portfolio}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><i className="fas fa-briefcase text-gray-400"></i> Experience</h4>
                   <p className="text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{profile?.experience || "No experience listed."}</p>
                </div>
                <div>
                   <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><i className="fas fa-graduation-cap text-gray-400"></i> Education</h4>
                   <p className="text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{profile?.education || "No education listed."}</p>
                </div>
                <div className="md:col-span-2">
                   <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><i className="fas fa-tools text-gray-400"></i> Skills</h4>
                   <div className="flex flex-wrap gap-2">
                     {profile?.skills ? profile.skills.split(',').map((skill: string, i: number) => (
                       <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">{skill.trim()}</span>
                     )) : <span className="text-gray-500 text-sm">No skills listed.</span>}
                   </div>
                </div>

                {profile?.preferredCategories && (
                  <div className="md:col-span-2">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><i className="fas fa-layer-group text-gray-400"></i> Preferred Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.preferredCategories.split(',').map((cat: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">{cat.trim()}</span>
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