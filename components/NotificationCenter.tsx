import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { sendNotification } from '../services/notificationService';

interface Notification {
  id: string;
  message: string;
  type: 'message' | 'status_update';
  read: boolean;
  createdAt: any;
  senderName?: string;
  senderId?: string;
}

interface NotificationCenterProps {
  label?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ label }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Reply Modal State
  const [replyState, setReplyState] = useState<{ isOpen: boolean; recipientId: string; recipientName: string }>({ isOpen: false, recipientId: '', recipientName: '' });
  const [replyMessage, setReplyMessage] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // Listen for real-time notification updates
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
      
      // Sort client-side to avoid Firestore index requirements
      notifs.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
        return dateB.getTime() - dateA.getTime();
      });

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    unread.forEach(n => markAsRead(n.id));
  };

  const handleReplyClick = (e: React.MouseEvent, notif: Notification) => {
    e.stopPropagation(); // Prevent triggering markAsRead immediately if desired, or let it bubble
    if (notif.senderId) {
      setReplyState({ isOpen: true, recipientId: notif.senderId, recipientName: notif.senderName || 'Recruiter' });
      setShowDropdown(false); // Close dropdown
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !user) return;
    try {
      await sendNotification(replyState.recipientId, replyMessage, 'message', user.uid, user.displayName || 'Candidate');
      alert('Reply sent!');
      setReplyState({ isOpen: false, recipientId: '', recipientName: '' });
      setReplyMessage('');
    } catch (error) {
      alert('Failed to send reply.');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-primary transition-colors focus:outline-none flex items-center gap-2"
      >
        {label && <span className="text-sm font-medium hidden md:block">{label}</span>}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-700">Chats & Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">No notifications yet</div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/50' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-primary' : 'bg-transparent'}`} />
                    <div>
                      {notif.senderName && (
                        <p className="text-xs font-bold text-gray-600 mb-0.5">{notif.senderName}</p>
                      )}
                      <p className="text-sm text-gray-800">{notif.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-400">
                          {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </p>
                        {notif.type === 'message' && notif.senderId && (
                          <button 
                            onClick={(e) => handleReplyClick(e, notif)}
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            Reply
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyState.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-gray-800 mb-4">Reply to {replyState.recipientName}</h3>
            <textarea
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary mb-4 min-h-[100px]"
              placeholder="Type your reply..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setReplyState({ ...replyState, isOpen: false })}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button onClick={sendReply} className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary-dark">
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;