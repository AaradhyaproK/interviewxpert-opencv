import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Job } from '../types';
import gsap from 'gsap';

interface Request {
  id: string;
  jobId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
  jobTitle?: string;
}

const InterviewRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading && requests.length > 0) {
      const ctx = gsap.context(() => {
        gsap.from('.requests-header', {
          y: -20,
          opacity: 0,
          duration: 0.6,
          ease: 'power3.out'
        });

        gsap.from('.status-pill', {
          x: 20,
          opacity: 0,
          duration: 0.6,
          delay: 0.2,
          ease: 'power3.out'
        });

        gsap.from('.request-row', {
          y: 20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.05,
          delay: 0.3,
          ease: 'power2.out'
        });
      });
      return () => ctx.revert();
    }
  }, [loading, requests]);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      try {
        // 1. Get all jobs by this recruiter
        const jobsQuery = query(collection(db, 'jobs'), where('recruiterUID', '==', user.uid));
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobMap = new Map<string, string>();
        jobsSnapshot.forEach(doc => {
          jobMap.set(doc.id, doc.data().title);
        });

        if (jobsSnapshot.empty) {
          setLoading(false);
          return;
        }

        // 2. Get requests for these jobs
        const requestsQuery = query(
          collection(db, 'interview_requests'),
          where('jobId', 'in', Array.from(jobMap.keys())),
          orderBy('createdAt', 'desc')
        );

        const requestsSnap = await getDocs(requestsQuery);
        const fetchedRequests = requestsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          jobTitle: jobMap.get(doc.data().jobId)
        })) as Request[];

        setRequests(fetchedRequests);
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [user]);

  const handleAction = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'interview_requests', requestId), { status });
      setRequests(requests.map(req => req.id === requestId ? { ...req, status } : req));
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
        <div className="requests-header">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Interview Requests</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage incoming interview applications from candidates.</p>
        </div>
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-gray-600 dark:text-gray-400 shadow-sm dark:shadow-none status-pill">
          <span className="text-gray-900 dark:text-white font-bold">{requests.filter(r => r.status === 'pending').length}</span> <span className="hidden sm:inline">Pending Requests</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-xl dark:shadow-none">
        {requests.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-500">
              <i className="fas fa-inbox text-2xl"></i>
            </div>
            <p className="text-gray-500 dark:text-gray-400">No interview requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-white/5">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {requests.map(request => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group request-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-900 flex-shrink-0 flex items-center justify-center border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-600 dark:text-white">
                          {request.userName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors">{request.userName}</div>
                          <div className="text-xs text-gray-500">{request.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-300">{request.jobTitle || 'Unknown Job'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${request.status === 'accepted' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20' :
                        request.status === 'rejected' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20' :
                          'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20'
                        }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {request.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleAction(request.id, 'accepted')}
                            className="p-2 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/20 text-green-600 dark:text-green-400 hover:scale-105 transition-all"
                            title="Accept"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            onClick={() => handleAction(request.id, 'rejected')}
                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 hover:scale-105 transition-all"
                            title="Reject"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-600 text-xs italic">
                          {request.status === 'accepted' ? 'Approved' : 'Declined'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewRequests;