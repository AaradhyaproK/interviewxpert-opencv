import React, { useState } from 'react';
import { sendNotification } from '../services/notificationService';
import { auth } from '../services/firebase';
import { useMessageBox } from './MessageBox';

interface RecruiterMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
}

const RecruiterMessageModal: React.FC<RecruiterMessageModalProps> = ({ isOpen, onClose, candidateId, candidateName }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messageBox = useMessageBox();

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      if (!candidateId) {
        throw new Error("Candidate ID is missing from the record.");
      }
      // Sends a notification of type 'message'
      await sendNotification(candidateId, message, 'message', auth.currentUser?.uid, auth.currentUser?.displayName || 'Recruiter');
      setMessage('');
      onClose();
      messageBox.showSuccess('Message sent successfully!');
    } catch (error) {
      console.error("Error sending message:", error);
      messageBox.showError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Message to {candidateName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <form onSubmit={handleSend} className="p-4">
          <textarea
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px] resize-none"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-primary to-primary-dark hover:to-primary rounded-lg shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecruiterMessageModal;