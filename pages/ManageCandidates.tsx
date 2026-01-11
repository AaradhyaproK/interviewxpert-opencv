import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

const ManageCandidates: React.FC = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<UserProfile[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && filteredCandidates.length > 0) {
      const ctx = gsap.context(() => {
        gsap.from('.manage-candidates-header', {
          y: -20,
          opacity: 0,
          duration: 0.6,
          ease: 'power3.out'
        });

        gsap.from('.search-container', {
          x: 20,
          opacity: 0,
          duration: 0.6,
          delay: 0.2,
          ease: 'power3.out'
        });

        gsap.from('.candidate-card', {
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
  }, [loading, filteredCandidates]);

  useEffect(() => {
    if (!user) return;
    const fetchCandidates = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'candidate'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data() as UserProfile);
        setCandidates(data);
        setFilteredCandidates(data);
      } catch (err) {
        console.error("Error fetching candidates:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, [user]);

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = candidates.filter(c =>
      (c.fullname || '').toLowerCase().includes(lowerTerm) ||
      (c.email || '').toLowerCase().includes(lowerTerm)
    );
    setFilteredCandidates(filtered);
  }, [searchTerm, candidates]);

  const toggleStatus = async (candidate: UserProfile) => {
    const newStatus: 'active' | 'disabled' = candidate.accountStatus === 'active' ? 'disabled' : 'active';
    const action = newStatus === 'active' ? 'Enable' : 'Disable';

    if (!window.confirm(`Are you sure you want to ${action.toLowerCase()} this account?`)) return;

    try {
      await updateDoc(doc(db, 'users', candidate.uid), {
        accountStatus: newStatus,
        updatedAt: serverTimestamp()
      });

      const updatedList = candidates.map(c =>
        c.uid === candidate.uid ? { ...c, accountStatus: newStatus } : c
      );
      setCandidates(updatedList);
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
    <div className="max-w-7xl mx-auto space-y-6 space-x-2 p-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="manage-candidates-header">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Manage Candidates</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">View and manage all registered candidates in the system.</p>
        </div>

        <div className="relative w-full md:w-80 search-container">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          <input
            type="text"
            placeholder="Search candidates..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-sm dark:shadow-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredCandidates.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/5 border-dashed">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-500">
              <i className="fas fa-user-slash text-2xl"></i>
            </div>
            <p className="text-gray-500 dark:text-gray-400">No candidates found.</p>
          </div>
        ) : (
          filteredCandidates.map(candidate => (
            <div key={candidate.uid} className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/5 p-5 flex flex-col hover:border-gray-300 dark:hover:border-white/10 transition-colors group shadow-sm dark:shadow-none candidate-card">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-[#1a1a1a] p-0.5 border border-gray-100 dark:border-white/10 overflow-hidden">
                  {candidate.profilePhotoURL ? (
                    <img src={candidate.profilePhotoURL} alt={candidate.fullname} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-black text-gray-400 dark:text-gray-500">
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                </div>
                <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${candidate.accountStatus === 'active'
                  ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20'
                  : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
                  }`}>
                  {candidate.accountStatus || 'active'}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{candidate.fullname || 'Unknown User'}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{candidate.email}</p>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 p-2.5 rounded-lg border border-gray-100 dark:border-white/5">
                  <div className="w-6 flex justify-center text-blue-500 dark:text-blue-400"><i className="fas fa-briefcase"></i></div>
                  <span className="truncate">{candidate.experience ? `${candidate.experience} years exp` : 'No exp listed'}</span>
                </div>
                {candidate.phone && (
                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 p-2.5 rounded-lg border border-gray-100 dark:border-white/5">
                    <div className="w-6 flex justify-center text-green-500 dark:text-green-400"><i className="fas fa-phone"></i></div>
                    <span className="truncate">{candidate.phone}</span>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 grid grid-cols-2 gap-3">
                <Link to={`/profile/${candidate.uid}`} className="flex items-center justify-center px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-medium text-gray-700 dark:text-white transition-colors">
                  View Profile
                </Link>
                <button
                  onClick={() => toggleStatus(candidate)}
                  className={`flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${candidate.accountStatus === 'active'
                    ? 'border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
                    : 'border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10'
                    }`}
                >
                  {candidate.accountStatus === 'active' ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageCandidates;