import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';

export const SKILL_OPTIONS = [
  "HTML", "CSS", "React", "Node.js", "JavaScript", "TypeScript", "Java", 
  "Python", "C++", "C#", "MongoDB", "SQL", "PostgreSQL", "Firebase", 
  "AWS", "Docker", "Git", "TensorFlow", "DSA", "Data Analysis", 
  "Machine Learning", "Next.js", "Vue.js", "Angular", "Express.js",
  "Redux", "Tailwind CSS", "SASS", "GraphQL", "Linux"
];

export const JOB_CATEGORIES = [
  "Software Development", "Data Science & Analytics", "Design & Creative", 
  "Marketing & Sales", "Finance & Accounting", "Human Resources", 
  "Engineering", "Product Management", "Customer Support", 
  "Legal", "Healthcare", "Education", "Operations & Admin"
];

const Profile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    photoURL: '',
    location: '',
    bio: '',
    linkedin: '',
    github: '',
    portfolio: '',
    education: '',
    experience: '',
    experienceYears: 0,
    skills: '',
    preferredCategories: ''
  });
  const [skillSearch, setSkillSearch] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      const loggedInUser = user;
      const profileUserId = userId || loggedInUser?.uid;

      setIsOwnProfile(!userId || (loggedInUser?.uid === userId));

      if (profileUserId) {
        try {
          const profileDocRef = doc(db, 'profiles', profileUserId);
          const userDocRef = doc(db, 'users', profileUserId);

          const [profileDocSnap, userDocSnap] = await Promise.all([
            getDoc(profileDocRef),
            getDoc(userDocRef)
          ]);

          const profileInfo = profileDocSnap.exists() ? profileDocSnap.data() : {};
          const userInfo = userDocSnap.exists() ? userDocSnap.data() : {};

          setFormData({
            displayName: profileInfo.displayName || userInfo.fullname || '',
            email: userInfo.email || '',
            phoneNumber: profileInfo.phoneNumber || userInfo.phone || '',
            photoURL: profileInfo.photoURL || userInfo.profilePhotoURL || '',
            location: profileInfo.location || '',
            bio: profileInfo.bio || '',
            linkedin: profileInfo.linkedin || '',
            github: profileInfo.github || '',
            portfolio: profileInfo.portfolio || '',
            education: profileInfo.education || '',
            experience: profileInfo.experience || '',
            experienceYears: userInfo.experience || 0,
            skills: profileInfo.skills || '',
            preferredCategories: profileInfo.preferredCategories || ''
          });

        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

  const toggleCategory = (category: string) => {
    const current = formData.preferredCategories 
      ? formData.preferredCategories.split(',').map(s => s.trim()).filter(s => s) 
      : [];
    
    let newCats;
    if (current.includes(category)) {
      newCats = current.filter(c => c !== category);
    } else {
      newCats = [...current, category];
    }
    setFormData({ ...formData, preferredCategories: newCats.join(', ') });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit
        alert("Image size too large. Please upload an image smaller than 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoURL: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        ...formData,
        updatedAt: new Date()
      }, { merge: true });
      alert('Profile updated successfully!');
      setIsEditing(false); // Switch back to view mode after saving
    } catch (err) {
      console.error("Error saving profile:", err);
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const downloadProfileAsPDF = () => {
    const doc = new jsPDF();
    let y = 15;
    doc.setFontSize(18);
    doc.text(formData.displayName, 10, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Email: ${formData.email}`, 10, y);
    y += 7;
    doc.text(`Location: ${formData.location}`, 10, y);
    y += 10;
    doc.setFontSize(14);
    doc.text("About", 10, y);
    y += 7;
    doc.setFontSize(10);
    const bioLines = doc.splitTextToSize(formData.bio, 180);
    doc.text(bioLines, 10, y);
    // ... add more sections
    doc.save(`${formData.displayName}_Profile.pdf`);
  };

  const downloadProfileAsJPG = async () => {
    const element = document.getElementById('profile-view-content');
    if (!element) return;

    try {
      // @ts-ignore
      const html2canvas = (await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm')).default;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `${formData.displayName}_Profile.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    } catch (error) {
      console.error("JPG generation failed", error);
      alert("Could not generate JPG.");
    }
  };


  if (loading) return <div className="p-6 text-center">Loading profile...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
       <div className="mb-6">
         <button onClick={() => navigate(-1)} className="text-primary hover:underline flex items-center gap-2">
           <i className="fas fa-arrow-left"></i> Back
         </button>
       </div>

      {!isEditing ? (
        // VIEW-ONLY PROFILE
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-gray-800">Candidate Profile</h2>
            <div className="flex flex-col md:flex-row gap-2">
              {isOwnProfile && (
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary-dark">
                  <i className="fas fa-edit"></i> Edit Profile
                </button>
              )}
              <button onClick={downloadProfileAsPDF} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700"><i className="fas fa-file-pdf"></i> PDF</button>
              <button onClick={downloadProfileAsJPG} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-orange-700"><i className="fas fa-image"></i> JPG</button>
            </div>
          </div>

        <div id="profile-view-content" className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start gap-8 mb-8 pb-8 border-b border-gray-200">
            <img 
              src={formData.photoURL || `https://ui-avatars.com/api/?name=${formData.displayName.replace(/\s/g, '+')}&background=random&color=fff`} 
              alt="Profile" 
              className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 shadow-md flex-shrink-0" 
            />
            <div className="flex-1">
              <h1 className="text-4xl font-extrabold text-gray-900">{formData.displayName}</h1>
              <p className="text-gray-500 mt-1 flex items-center gap-2"><i className="fas fa-map-marker-alt"></i> {formData.location || 'Location not specified'}</p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700"><i className="fas fa-tools text-primary w-4"></i> <span className="font-bold">{formData.skills.split(',').filter(s => s).length}</span> Skills</div>
                <div className="flex items-center gap-2 text-gray-700"><i className="fas fa-briefcase text-primary w-4"></i> <span className="font-bold">{formData.experienceYears}</span> Years Exp.</div>
              </div>
            </div>
          </div>

          {/* Main Body */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left/Main Column */}
            <div className="lg:col-span-2 space-y-8">
              {formData.bio && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">About Me</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{formData.bio}</p>
                </div>
              )}
              {formData.experience && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">Experience</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{formData.experience}</p>
                </div>
              )}
              {formData.education && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">Education</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{formData.education}</p>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-8">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Contact & Links</h3>
                <div className="space-y-3 text-sm">
                  {formData.email && <div className="flex items-center gap-3 truncate"><i className="fas fa-envelope text-gray-400 w-4 text-center"></i><a href={`mailto:${formData.email}`} className="text-primary hover:underline">{formData.email}</a></div>}
                  {formData.phoneNumber && <div className="flex items-center gap-3"><i className="fas fa-phone text-gray-400 w-4 text-center"></i><span>{formData.phoneNumber}</span></div>}
                  {formData.portfolio && <div className="flex items-center gap-3 truncate"><i className="fas fa-globe text-gray-400 w-4 text-center"></i><a href={formData.portfolio} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Portfolio</a></div>}
                  {formData.linkedin && <div className="flex items-center gap-3 truncate"><i className="fab fa-linkedin text-gray-400 w-4 text-center"></i><a href={formData.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn</a></div>}
                  {formData.github && <div className="flex items-center gap-3 truncate"><i className="fab fa-github text-gray-400 w-4 text-center"></i><a href={formData.github} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub</a></div>}
                </div>
              </div>
              {formData.skills && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.split(',').map(s => s.trim()).filter(s => s).map(skill => (
                      <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-medium border border-blue-100">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {formData.preferredCategories && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Preferred Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.preferredCategories.split(',').map(c => c.trim()).filter(c => c).map(cat => (
                      <span key={cat} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">{cat}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      ) : (
        // EDITABLE PROFILE for the logged-in user
        <>
       <div className="flex justify-between items-center mb-6">
         <h2 className="text-3xl font-bold text-gray-800">Edit My Profile</h2>
         <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
           Cancel
         </button>
       </div>
       <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
         
         {/* Profile Header with Image */}
         <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
           <div className="relative group">
             <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
               {formData.photoURL ? (
                 <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-3xl text-gray-400 font-bold">
                   {formData.displayName ? formData.displayName.charAt(0).toUpperCase() : <i className="fas fa-user"></i>}
                 </span>
               )}
             </div>
             <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-dark shadow-md transition-colors">
               <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                 <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
               </svg>
             </label>
           </div>
           <div>
             <h3 className="text-lg font-bold text-gray-800">{formData.displayName || 'Your Name'}</h3>
             <p className="text-sm text-gray-500">{auth.currentUser?.email}</p>
           </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
             <input type="text" name="displayName" value={formData.displayName} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="John Doe" />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
             <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="+1 (555) 000-0000" />
           </div>
           <div className="md:col-span-2">
             <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
             <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="City, Country" />
           </div>
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Professional Bio</label>
           <textarea name="bio" value={formData.bio} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded h-24 focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Brief summary about yourself..." />
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile URL</label>
           <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="https://linkedin.com/in/..." />
         </div>
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Profile URL</label>
           <input type="url" name="github" value={formData.github} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="https://github.com/..." />
         </div>
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio / Website</label>
           <input type="url" name="portfolio" value={formData.portfolio} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="https://myportfolio.com" />
         </div>
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
           <textarea name="education" value={formData.education} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded h-24 focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="University, Degree, Year..." />
         </div>
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
           <textarea name="experience" value={formData.experience} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded h-24 focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Job Title, Company, Duration..." />
         </div>
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
           <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 border border-gray-200 rounded-lg bg-gray-50">
             {formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s).map(skill => (
               <span key={skill} className="px-3 py-1 bg-primary text-white rounded-full text-sm flex items-center gap-2">
                 {skill}
                 <button type="button" onClick={() => toggleSkill(skill)} className="hover:text-gray-200 font-bold">&times;</button>
               </span>
             )) : <span className="text-gray-400 text-sm p-1">No skills selected</span>}
           </div>
           
           <div className="flex gap-2 mb-2">
             <input 
               type="text"
               className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
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
           
           <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
             <p className="text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">Select Skills</p>
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
                         ? 'bg-primary/10 border-primary text-primary font-medium ring-1 ring-primary' 
                         : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                     }`}
                   >
                     {skill} {isSelected && '✓'}
                   </button>
                 );
               })}
             </div>
           </div>
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Job Categories</label>
           <div className="flex flex-wrap gap-2">
             {JOB_CATEGORIES.map(cat => {
               const isSelected = formData.preferredCategories.split(',').map(s => s.trim()).includes(cat);
               return (
                 <button
                   key={cat}
                   type="button"
                   onClick={() => toggleCategory(cat)}
                   className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                     isSelected 
                       ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' 
                       : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                   }`}
                 >
                   {cat}
                 </button>
               );
             })}
           </div>
         </div>

         <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50 transition-colors">
           {saving ? 'Saving...' : 'Save Profile'}
         </button>
       </form>
        </>
      )}
    </div>
  );
};
export default Profile;