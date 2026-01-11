import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc, setDoc, serverTimestamp, updateDoc, orderBy } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../services/firebase';

const AdminDashboard: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'jobs' | 'transactions'>('requests');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'candidate' | 'recruiter'>('all');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'requests') {
        const q = query(collection(db, 'recruiterRequests'), where('status', '==', 'pending'));
        const snap = await getDocs(q);
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else if (activeTab === 'users') {
        const q = query(collection(db, 'users'));
        const snap = await getDocs(q);
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else if (activeTab === 'jobs') {
        const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else if (activeTab === 'transactions') {
        const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRecruiter = async (req: any) => {
    const tempPassword = prompt(`Enter a temporary password for ${req.email}:`, "Password123!");
    if (!tempPassword) return;

    setProcessingId(req.id);
    
    // Initialize a secondary app to create user without logging out the admin
    const secondaryApp = initializeApp(auth.app.options, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // 1. Create Auth User
      const cred = await createUserWithEmailAndPassword(secondaryAuth, req.email, tempPassword);
      
      // 2. Create User Document
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: req.email,
        fullname: req.fullname,
        role: 'recruiter',
        experience: req.experience || 0,
        accountStatus: 'active',
        createdAt: serverTimestamp(),
        profilePhotoURL: null
      });

      // 3. Delete Request
      await deleteDoc(doc(db, 'recruiterRequests', req.id));
      
      // 4. Cleanup
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      alert(`Recruiter created successfully!\nEmail: ${req.email}\nPassword: ${tempPassword}`);
      fetchData();
    } catch (error: any) {
      console.error("Error approving recruiter:", error);
      alert("Failed to create recruiter: " + error.message);
      await deleteApp(secondaryApp); // Ensure cleanup on error
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (id: string) => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    try {
      await deleteDoc(doc(db, 'recruiterRequests', id));
      fetchData();
    } catch (error) {
      console.error("Error rejecting:", error);
    }
  };

  const toggleUserStatus = async (user: any) => {
    if (user.role === 'admin') return; // Prevent locking admin
    const newStatus = user.accountStatus === 'active' ? 'disabled' : 'active';
    try {
      await updateDoc(doc(db, 'users', user.id), { accountStatus: newStatus });
      setUsers(users.map(u => u.id === user.id ? { ...u, accountStatus: newStatus } : u));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to delete this job posting?")) return;
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This will remove their account data.")) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      try { await deleteDoc(doc(db, 'profiles', userId)); } catch (e) {}
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  const toggleEmailVerification = async (user: any) => {
    const newStatus = !user.adminVerified;
    try {
      await updateDoc(doc(db, 'users', user.id), { adminVerified: newStatus });
      setUsers(users.map(u => u.id === user.id ? { ...u, adminVerified: newStatus } : u));
    } catch (error) {
      console.error("Error updating verification:", error);
    }
  };

  const filteredData = () => {
    const term = searchTerm.toLowerCase();
    switch (activeTab) {
      case 'requests':
        return requests.filter(r => r.fullname?.toLowerCase().includes(term) || r.email?.toLowerCase().includes(term));
      case 'users':
        return users.filter(u => {
          const matchesSearch = u.fullname?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term);
          const matchesFilter = userFilter === 'all' || u.role === userFilter;
          return matchesSearch && matchesFilter;
        });
      case 'jobs':
        return jobs.filter(j => j.title?.toLowerCase().includes(term) || j.companyName?.toLowerCase().includes(term));
      case 'transactions':
        return transactions.filter(t => t.userName?.toLowerCase().includes(term) || t.paymentId?.toLowerCase().includes(term));
      default:
        return [];
    }
  };

  const totalProfit = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
        <div className="relative w-full md:w-64">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-slate-800 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'requests' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'}`}
        >
          Recruiter Requests
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'}`}
        >
          Manage Users
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'jobs' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'}`}
        >
          Manage Jobs
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'transactions' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'}`}
        >
          Transactions
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          {activeTab === 'requests' ? (
            filteredData().length === 0 ? (
              <div className="p-8 text-center text-gray-500">No pending recruiter requests.</div>
            ) : (
              <table className="w-full text-left table-fixed">
                <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-sm uppercase">
                  <tr>
                    <th className="p-4 w-1/4">Name</th>
                    <th className="p-4 w-1/3">Email</th>
                    <th className="p-4 w-1/6">Experience</th>
                    <th className="p-4 text-right w-1/4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {filteredData().map(req => (
                    <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="p-4 font-medium text-gray-900 dark:text-white truncate">{req.fullname}</td>
                      <td className="p-4 text-gray-600 dark:text-slate-300 truncate">{req.email}</td>
                      <td className="p-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">{req.experience} years</td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => handleApproveRecruiter(req)}
                          disabled={!!processingId}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-bold hover:bg-green-200 disabled:opacity-50"
                        >
                          {processingId === req.id ? 'Creating...' : 'Approve'}
                        </button>
                        <button onClick={() => handleRejectRequest(req.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200">Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : activeTab === 'users' ? (
            <>
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2 bg-gray-50/50 dark:bg-slate-900/50">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mr-2">Filter:</span>
                <button onClick={() => setUserFilter('all')} className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${userFilter === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>All</button>
                <button onClick={() => setUserFilter('candidate')} className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${userFilter === 'candidate' ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>Candidates</button>
                <button onClick={() => setUserFilter('recruiter')} className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${userFilter === 'recruiter' ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>Recruiters</button>
            </div>
            <table className="w-full text-left table-fixed">
              <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-sm uppercase">
                <tr>
                  <th className="p-4 w-1/3">User</th>
                  <th className="p-4 w-1/6">Role</th>
                  <th className="p-4 w-1/6">Status</th>
                  <th className="p-4 text-right w-1/3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredData().map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="p-4">
                      <div className="font-medium text-gray-900 dark:text-white truncate">{u.fullname}</div>
                      <div className="text-xs text-gray-500 truncate">{u.email}</div>
                    </td>
                    <td className="p-4 capitalize text-gray-600 dark:text-slate-300">{u.role}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.accountStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.accountStatus || 'active'}</span>
                      {u.adminVerified && <span className="ml-2 px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">Verified</span>}
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'admin' && (
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => toggleEmailVerification(u)} className="text-purple-600 hover:underline text-sm font-medium">
                            {u.adminVerified ? 'Unverify' : 'Verify Email'}
                          </button>
                          <button onClick={() => toggleUserStatus(u)} className="text-blue-600 hover:underline text-sm font-medium">
                            {u.accountStatus === 'active' ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-800 hover:underline text-sm font-medium">
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </>
          ) : activeTab === 'jobs' ? (
            <table className="w-full text-left table-fixed">
              <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-sm uppercase">
                <tr>
                  <th className="p-4 w-1/3">Job Title</th>
                  <th className="p-4 w-1/4">Company</th>
                  <th className="p-4 w-1/6">Posted Date</th>
                  <th className="p-4 text-right w-1/4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredData().map(job => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 font-medium text-gray-900 dark:text-white truncate" title={job.title}>{job.title}</td>
                    <td className="p-4 text-gray-600 dark:text-slate-300 truncate">{job.companyName}</td>
                    <td className="p-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">{job.createdAt?.toDate ? job.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDeleteJob(job.id)} className="text-red-600 hover:text-red-800 hover:underline text-sm font-medium">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // Transactions Tab
            <div>
              <div className="p-6 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-green-800 dark:text-green-300">Platform Profit</h3>
                  <p className="text-sm text-green-600 dark:text-green-400">Total revenue from wallet recharges</p>
                </div>
                <div className="text-3xl font-extrabold text-green-700 dark:text-green-400">₹{totalProfit}</div>
              </div>
              <table className="w-full text-left table-fixed">
                <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-sm uppercase">
                  <tr>
                    <th className="p-4 w-1/3">User</th>
                    <th className="p-4 w-1/6">Amount</th>
                    <th className="p-4 w-1/4">Payment ID</th>
                    <th className="p-4 w-1/4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {filteredData().map(t => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="p-4 font-medium text-gray-900 dark:text-white">
                        <div className="truncate">{t.userName}</div>
                        <div className="text-xs text-gray-500 font-normal truncate">{t.userEmail}</div>
                      </td>
                      <td className="p-4 text-green-600 font-bold whitespace-nowrap">+₹{t.amount}</td>
                      <td className="p-4 text-gray-600 dark:text-slate-300 text-xs font-mono truncate" title={t.paymentId}>{t.paymentId}</td>
                      <td className="p-4 text-gray-600 dark:text-slate-300 text-sm whitespace-nowrap">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;