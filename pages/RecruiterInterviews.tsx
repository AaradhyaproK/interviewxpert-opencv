import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Interview } from '../types';
import { useMessageBox } from '../components/MessageBox';
import { createPortal } from 'react-dom';

const RecruiterInterviews: React.FC = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [editedData, setEditedData] = useState<Partial<Interview>>({});
  const [newEmail, setNewEmail] = useState('');
  const [newEmails, setNewEmails] = useState<string[]>([]);
  const [parsingResume, setParsingResume] = useState(false);
  const messageBox = useMessageBox();

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    setLoading(true);
    const interviewsQuery = query(
      collection(db, 'interviews'),
      where('recruiterUID', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(interviewsQuery, (querySnapshot) => {
      const interviewsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interview));
      setInterviews(interviewsData);
      setLoading(false);
    }, (err) => {
        console.error("Error fetching interviews:", err);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = (interviewId: string) => {
    messageBox.showConfirm("Are you sure you want to delete this interview?", async () => {
      try {
        await deleteDoc(doc(db, 'interviews', interviewId));
      } catch (err) {
        messageBox.showError("Error deleting interview");
      }
    });
  };

  const openEditModal = (interview: Interview) => {
    setSelectedInterview(interview);
    setEditedData(interview);
    setIsEditModalOpen(true);
  };

  const openInviteModal = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsInviteModalOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedData({ ...editedData, [e.target.name]: e.target.value });
  };

  const handleAddEmail = () => {
    if (newEmail && editedData.candidateEmails) {
        setEditedData({ ...editedData, candidateEmails: [...editedData.candidateEmails, newEmail] });
        setNewEmail('');
    }
  };

  const handleRemoveEmail = (email: string) => {
      if (editedData.candidateEmails) {
          setEditedData({ ...editedData, candidateEmails: editedData.candidateEmails.filter(e => e !== email) });
      }
  };

  const handleRemoveNewEmail = (emailToRemove: string) => {
      setNewEmails(newEmails.filter(email => email !== emailToRemove));
  };

  const handleUpdateInterview = async () => {
      if (!selectedInterview) return;
      try {
          await updateDoc(doc(db, 'interviews', selectedInterview.id), editedData);
          messageBox.showSuccess('Interview updated successfully!');
          setIsEditModalOpen(false);
          setSelectedInterview(null);
      } catch (error) {
          messageBox.showError('Failed to update interview.');
      }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const allowedTypes = ['text/plain', 'application/pdf'];
      
      if (!allowedTypes.includes(file.type)) {
          messageBox.showError("Unsupported file type. Please upload a PDF or TXT file.");
          e.target.value = ''; // Reset file input
          return;
      }
      
      setParsingResume(true);

      try {
          let resumeText = '';
          if (file.type === 'text/plain') {
              resumeText = await file.text();
          } else if (file.type === 'application/pdf') {
              messageBox.showInfo("Simulating PDF text extraction. This requires a library like pdf.js for full functionality.");
              resumeText = `Simulated text from PDF. Found an email: pdf-candidate@example.com. And another one: test@test.com`;
          }

          const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
          const foundEmails = resumeText.match(emailRegex);

          if (foundEmails && foundEmails.length > 0) {
              const emailToAdd = foundEmails[0];
              if (newEmails.includes(emailToAdd) || selectedInterview?.candidateEmails.includes(emailToAdd)) {
                  messageBox.showInfo(`Email ${emailToAdd} is already in the list.`);
              } else {
                  setNewEmails([...newEmails, emailToAdd]);
                  messageBox.showSuccess(`Detected email: ${emailToAdd}`);
              }
          } else {
              messageBox.showError("No email address could be detected in the resume.");
          }

      } catch (error) {
          console.error("Error parsing resume:", error);
          messageBox.showError("An error occurred while parsing the resume.");
      } finally {
          setParsingResume(false);
          e.target.value = '';
      }
  };

  const handleSendInvites = async () => {
    if (!selectedInterview || newEmails.length === 0) return;
    try {
        await updateDoc(doc(db, 'interviews', selectedInterview.id), { 
            candidateEmails: arrayUnion(...newEmails) 
        });
        
        const subject = `Invitation to Interview: ${selectedInterview.title}`;
        const body = `
            <p>Dear Candidate,</p>
            <p>You have been invited for an interview for the role of ${selectedInterview.title}.</p>
            <p>Please use the following link and access code to join the interview:</p>
            <p><strong>Link:</strong> <a href="${selectedInterview.interviewLink}">${selectedInterview.interviewLink}</a></p>
            <p><strong>Access Code:</strong> ${selectedInterview.accessCode}</p>
            <p>Best regards,</p>
            <p>The Recruitment Team</p>
        `;
        const mailtoLink = `mailto:${newEmails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;

        messageBox.showSuccess('Invitations sent successfully!');
        setIsInviteModalOpen(false);
        setSelectedInterview(null);
        setNewEmails([]);
    } catch (error) {
        messageBox.showError('Failed to send invitations.');
    }
  };


  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-gray-200 dark:border-white/5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">My Interviews</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all your scheduled interviews.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/recruiter/interview/create" className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white dark:text-black font-semibold rounded-full shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm">
            <i className="fas fa-plus"></i> <span>Create New Interview</span>
          </Link>
        </div>
      </div>

      {interviews.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/5 border-dashed">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                <i className="fas fa-video text-2xl"></i>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-6">You haven't created any interviews yet.</p>
            <Link to="/recruiter/interview/create" className="text-primary font-medium hover:underline hover:text-primary-light transition-colors">Create your first interview</Link>
        </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {interviews.map(interview => (
                <div key={interview.id} className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-6 flex flex-col">
                    <div className="flex-grow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{interview.title}</h3>
                                <p className="text-sm text-gray-500">{interview.department}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => openInviteModal(interview)} className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors" title="Invite">
                                    <i className="fas fa-user-plus"></i>
                                </button>
                                <Link to={`/interview/${interview.id}`} target="_blank" className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" title="Open Interview">
                                    <i className="fas fa-external-link-alt"></i>
                                </Link>
                                <button onClick={() => openEditModal(interview)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Edit">
                                    <i className="fas fa-pencil-alt"></i>
                                </button>
                                <button onClick={() => handleDelete(interview.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete">
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{interview.description}</p>
                        <div>
                            <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Candidates:</h4>
                            <div className="flex flex-wrap gap-2">
                                {interview.candidateEmails.map(email => (
                                    <span key={email} className="bg-gray-200 dark:bg-gray-700 text-xs rounded-full px-2 py-1">{email}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 text-xs text-gray-500">
                        Created on: {interview.createdAt?.toDate ? interview.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </div>
                </div>
            ))}
        </div>
    )}

    {isEditModalOpen && selectedInterview && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col text-gray-900 dark:text-white">
                <h3 className="font-bold text-lg p-4 border-b border-gray-200 dark:border-gray-700">Edit Interview</h3>
                <div className="p-4 space-y-4 overflow-y-auto">
                    <input name="title" value={editedData.title || ''} onChange={handleEditChange} placeholder="Interview Title" className="w-full p-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                    <textarea name="description" value={editedData.description || ''} onChange={handleEditChange} placeholder="Description" className="w-full p-2 border rounded min-h-[100px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                    <div>
                        <h4 className="font-semibold mb-2">Candidate Emails</h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {editedData.candidateEmails?.map(email => (
                                <div key={email} className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm">
                                    {email}
                                    <button onClick={() => handleRemoveEmail(email)} className="text-red-500 hover:text-red-700">&times;</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Add new email" className="w-full p-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                            <button onClick={handleAddEmail} className="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => setIsEditModalOpen(false)} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded">Cancel</button>
                    <button onClick={handleUpdateInterview} className="bg-green-500 text-white px-4 py-2 rounded">Save</button>
                </div>
            </div>
        </div>,
        document.body
    )}

    {isInviteModalOpen && selectedInterview && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col text-gray-900 dark:text-white">
                <h3 className="font-bold text-lg p-4 border-b border-gray-200 dark:border-gray-700">Invite Candidates</h3>
                <div className="p-4 space-y-4 overflow-y-auto">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <h4 className="font-semibold text-sm">Access Code</h4>
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-lg tracking-widest">{selectedInterview.accessCode}</span>
                            <button onClick={() => navigator.clipboard.writeText(selectedInterview.accessCode || '')} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" title="Copy Access Code">
                                <i className="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Upload Resume to Find Email</label>
                        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                            <i className={`fas fa-cloud-upload-alt ${parsingResume ? 'fa-spin' : ''}`}></i>
                            <span className="font-medium text-sm">{parsingResume ? 'Parsing Resume...' : 'Upload Resume (PDF/TXT)'}</span>
                            <input type="file" accept=".pdf,.txt" className="hidden" onChange={handleResumeUpload} disabled={parsingResume} />
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Add Email Manually</label>
                        <div className="flex gap-2">
                            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Candidate email" className="w-full p-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                            <button onClick={() => {setNewEmails([...newEmails, newEmail]); setNewEmail('');}} className="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">New Candidates to Invite:</h4>
                        <div className="flex flex-wrap gap-2">
                            {newEmails.map(email => (
                                <div key={email} className="flex items-center gap-2 bg-gray-200 dark:bg-gray-600 rounded-full px-3 py-1 text-sm">
                                    <span>{email}</span>
                                    <button onClick={() => handleRemoveNewEmail(email)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => setIsInviteModalOpen(false)} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded">Cancel</button>
                    <button onClick={handleSendInvites} className="bg-green-500 text-white px-4 py-2 rounded">Send Invites</button>
                </div>
            </div>
        </div>,
        document.body
    )}
    </div>
    );
};

export default RecruiterInterviews;
