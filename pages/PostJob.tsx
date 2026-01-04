import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SKILL_OPTIONS, JOB_CATEGORIES } from './Profile';

const PostJob: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    qualifications: '',
    deadline: '',
    description: '',
    permission: 'anyone',
    skills: '',
    category: ''
  });
  const [skillSearch, setSkillSearch] = useState('');

  const toggleSkill = (skill: string) => {
    const currentSkills = formData.skills 
      ? formData.skills.split(',').map(s => s.trim()).filter(s => s) 
      : [];
    
    let newSkills;
    if (currentSkills.includes(skill)) {
      newSkills = currentSkills.filter(s => s !== skill);
    } else {
      newSkills = [...currentSkills, skill];
    }
    setFormData({ ...formData, skills: newSkills.join(', ') });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const deadlineDate = new Date(formData.deadline);
      await addDoc(collection(db, 'jobs'), {
        title: formData.title,
        companyName: formData.companyName,
        qualifications: formData.qualifications,
        description: formData.description,
        interviewPermission: formData.permission,
        skills: formData.skills,
        category: formData.category,
        applyDeadline: Timestamp.fromDate(deadlineDate),
        recruiterUID: user.uid,
        recruiterName: userProfile?.fullname || user.email,
        recruiterEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      navigate('/recruiter/jobs');
    } catch (err) {
      console.error(err);
      alert("Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <i className="fas fa-briefcase text-primary"></i> Post a New Job
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Title</label>
            <input 
              type="text" required 
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <input 
              type="text" required 
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={formData.companyName}
              onChange={e => setFormData({...formData, companyName: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Qualifications</label>
          <textarea 
            required rows={3}
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={formData.qualifications}
            onChange={e => setFormData({...formData, qualifications: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Deadline</label>
            <input 
              type="date" required 
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={formData.deadline}
              onChange={e => setFormData({...formData, deadline: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Interview Access</label>
            <select 
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={formData.permission}
              onChange={e => setFormData({...formData, permission: e.target.value})}
            >
              <option value="anyone">Direct Start (No Request)</option>
              <option value="request">Request Permission Needed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Job Description</label>
          <textarea 
            required rows={5}
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Job Category</label>
          <select 
            name="category" 
            value={formData.category} 
            onChange={e => setFormData({...formData, category: e.target.value})}
            className="mt-1 w-full px-3 py-2 border rounded-md"
          >
            <option value="">Select a Category</option>
            {JOB_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Required Skills</label>
          <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-2 border rounded-md bg-gray-50 mt-1">
            {formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s).map(skill => (
              <span key={skill} className="px-2 py-1 bg-primary text-white rounded-full text-sm flex items-center gap-1">
                {skill}
                <button type="button" onClick={() => toggleSkill(skill)} className="hover:text-gray-200 font-bold">&times;</button>
              </span>
            )) : <span className="text-gray-400 text-sm p-1">No skills selected</span>}
          </div>

          <div className="flex gap-2 mb-2">
             <input 
               type="text"
               className="flex-1 px-3 py-2 border rounded-md"
               placeholder="Search or add custom skill..."
               value={skillSearch}
               onChange={e => setSkillSearch(e.target.value)}
               onKeyDown={e => {
                 if (e.key === 'Enter') {
                   e.preventDefault();
                   if (skillSearch.trim()) {
                     toggleSkill(skillSearch.trim());
                     setSkillSearch('');
                   }
                 }
               }}
             />
             <button 
               type="button"
               onClick={() => {
                 if (skillSearch.trim()) {
                   toggleSkill(skillSearch.trim());
                   setSkillSearch('');
                 }
               }}
               className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
             >
               Add
             </button>
          </div>

          <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase())).map(skill => {
                 const isSelected = formData.skills.split(',').map(s => s.trim()).includes(skill);
                 return (
                   <button
                     key={skill}
                     type="button"
                     onClick={() => toggleSkill(skill)}
                     className={`px-3 py-1 rounded-full text-sm border transition-all ${
                       isSelected 
                         ? 'bg-primary/10 border-primary text-primary font-medium' 
                         : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                     }`}
                   >
                     {skill} {isSelected && '✓'}
                   </button>
                 );
              })}
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post Job'}
        </button>
      </form>
    </div>
  );
};

export default PostJob;