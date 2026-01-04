import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Job } from '../types';

const RecruiterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchJobs = async () => {
      try {
        const q = query(
          collection(db, 'jobs'), 
          where('recruiterUID', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
      } catch (err) {
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [user]);

  const handleDelete = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (err) {
      alert("Error deleting job");
    }
  };

  if (loading) return <div className="text-center py-10">Loading dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Recruiter Dashboard</h1>
        <Link to="/recruiter/post" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg shadow transition-colors">
          <i className="fas fa-plus mr-2"></i> Post New Job
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-bold uppercase">Active Jobs</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">{jobs.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <Link to="/recruiter/requests" className="block h-full">
            <h3 className="text-gray-500 text-sm font-bold uppercase hover:text-primary transition-colors">Pending Requests</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">View <i className="fas fa-arrow-right text-sm ml-1"></i></p>
           </Link>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <Link to="/recruiter/candidates" className="block h-full">
            <h3 className="text-gray-500 text-sm font-bold uppercase hover:text-primary transition-colors">Total Candidates</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">Manage <i className="fas fa-arrow-right text-sm ml-1"></i></p>
           </Link>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-4">Your Posted Jobs</h2>
      
      {jobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 mb-4">You haven't posted any jobs yet.</p>
          <Link to="/recruiter/post" className="text-primary font-medium hover:underline">Post your first job</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{job.title}</div>
                      <div className="text-xs text-gray-500">{job.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {job.createdAt?.toDate ? job.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {job.applyDeadline?.toDate ? job.applyDeadline.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/recruiter/job/${job.id}/candidates`} className="text-primary hover:text-primary-dark mr-4" title="View Candidates">
                        <i className="fas fa-users"></i>
                      </Link>
                      <Link to={`/recruiter/edit-job/${job.id}`} className="text-gray-600 hover:text-gray-900 mr-4" title="Edit">
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button onClick={() => handleDelete(job.id)} className="text-red-600 hover:text-red-900" title="Delete">
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;