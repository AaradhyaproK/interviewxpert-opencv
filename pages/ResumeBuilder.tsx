import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

interface Experience {
  id: number;
  role: string;
  company: string;
  duration: string;
  description: string;
}

interface Education {
  id: number;
  degree: string;
  school: string;
  year: string;
}

interface Project {
  id: number;
  title: string;
  link: string;
  description: string;
}

interface Certification {
  id: number;
  name: string;
  issuer: string;
  year: string;
}

interface Volunteering {
  id: number;
  role: string;
  organization: string;
  duration: string;
  description: string;
}

const ResumeBuilder: React.FC = () => {
  const [step, setStep] = useState(1);
  const [activeTemplate, setActiveTemplate] = useState<'modern' | 'classic'>('modern');
  
  // Resume State
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: ''
  });
  const [summary, setSummary] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [volunteering, setVolunteering] = useState<Volunteering[]>([]);
  const [hobbies, setHobbies] = useState('');

  // Temporary state for adding new items
  const [tempExp, setTempExp] = useState<Experience>({ id: 0, role: '', company: '', duration: '', description: '' });
  const [tempEdu, setTempEdu] = useState<Education>({ id: 0, degree: '', school: '', year: '' });
  const [tempProject, setTempProject] = useState<Project>({ id: 0, title: '', link: '', description: '' });
  const [tempCert, setTempCert] = useState<Certification>({ id: 0, name: '', issuer: '', year: '' });
  const [tempVol, setTempVol] = useState<Volunteering>({ id: 0, role: '', organization: '', duration: '', description: '' });

  const addExperience = () => {
    if (tempExp.role && tempExp.company) {
      setExperiences([...experiences, { ...tempExp, id: Date.now() }]);
      setTempExp({ id: 0, role: '', company: '', duration: '', description: '' });
    }
  };

  const addEducation = () => {
    if (tempEdu.degree && tempEdu.school) {
      setEducation([...education, { ...tempEdu, id: Date.now() }]);
      setTempEdu({ id: 0, degree: '', school: '', year: '' });
    }
  };

  const addProject = () => {
    if (tempProject.title) {
      setProjects([...projects, { ...tempProject, id: Date.now() }]);
      setTempProject({ id: 0, title: '', link: '', description: '' });
    }
  };

  const addCertification = () => {
    if (tempCert.name) {
      setCertifications([...certifications, { ...tempCert, id: Date.now() }]);
      setTempCert({ id: 0, name: '', issuer: '', year: '' });
    }
  };

  const addVolunteering = () => {
    if (tempVol.role && tempVol.organization) {
      setVolunteering([...volunteering, { ...tempVol, id: Date.now() }]);
      setTempVol({ id: 0, role: '', organization: '', duration: '', description: '' });
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    if (activeTemplate === 'modern') {
      // --- MODERN TEMPLATE ---
      // Sidebar Background
      doc.setFillColor(30, 58, 138); // Dark Blue
      doc.rect(0, 0, 70, 297, 'F');
      
      // --- SIDEBAR CONTENT (Left) ---
      doc.setTextColor(255, 255, 255);
      
      // Name
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      const nameLines = doc.splitTextToSize(personalInfo.fullName || 'Your Name', 60);
      doc.text(nameLines, 10, 20);
      let ySidebar = 20 + (nameLines.length * 8) + 10;

      // Contact Info
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const contactInfo = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin].filter(Boolean);
      contactInfo.forEach(info => {
        doc.text(info, 10, ySidebar);
        ySidebar += 6;
      });
      ySidebar += 10;

      // Education (Sidebar)
      if (education.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('EDUCATION', 10, ySidebar);
        ySidebar += 6;
        doc.setDrawColor(255, 255, 255);
        doc.line(10, ySidebar, 60, ySidebar);
        ySidebar += 6;

        education.forEach(edu => {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(edu.school, 10, ySidebar);
          ySidebar += 5;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(edu.degree, 10, ySidebar);
          ySidebar += 5;
          doc.text(edu.year, 10, ySidebar);
          ySidebar += 10;
        });
      }
      
      // Certifications (Sidebar)
      if (certifications.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('CERTIFICATIONS', 10, ySidebar);
        ySidebar += 6;
        doc.setDrawColor(255, 255, 255);
        doc.line(10, ySidebar, 60, ySidebar);
        ySidebar += 6;

        certifications.forEach(cert => {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(cert.name, 10, ySidebar);
          ySidebar += 5;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(cert.issuer, 10, ySidebar);
          ySidebar += 5;
          doc.text(cert.year, 10, ySidebar);
          ySidebar += 10;
        });
      }

      // Skills (Sidebar)
      if (skills) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('SKILLS', 10, ySidebar);
        ySidebar += 6;
        doc.line(10, ySidebar, 60, ySidebar);
        ySidebar += 6;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const splitSkills = doc.splitTextToSize(skills, 50);
        doc.text(splitSkills, 10, ySidebar);
        ySidebar += splitSkills.length * 4 + 10;
      }

      // Hobbies (Sidebar)
      if (hobbies) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('HOBBIES', 10, ySidebar);
        ySidebar += 6;
        doc.line(10, ySidebar, 60, ySidebar);
        ySidebar += 6;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const splitHobbies = doc.splitTextToSize(hobbies, 50);
        doc.text(splitHobbies, 10, ySidebar);
      }

      // --- MAIN CONTENT (Right) ---
      doc.setTextColor(0, 0, 0);
      let yMain = 20;
      const marginMain = 80;

      // Summary
      if (summary) {
        doc.setFontSize(14);
        doc.setTextColor(30, 58, 138);
        doc.setFont('helvetica', 'bold');
        doc.text('PROFESSIONAL SUMMARY', marginMain, yMain);
        yMain += 8;
        
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
        const splitSum = doc.splitTextToSize(summary, 110);
        doc.text(splitSum, marginMain, yMain);
        yMain += splitSum.length * 5 + 10;
      }

      // Experience
      if (experiences.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(30, 58, 138);
        doc.setFont('helvetica', 'bold');
        doc.text('EXPERIENCE', marginMain, yMain);
        yMain += 8;

        experiences.forEach(exp => {
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text(exp.role, marginMain, yMain);
          yMain += 5;

          doc.setFontSize(10);
          doc.setTextColor(30, 58, 138);
          doc.text(exp.company, marginMain, yMain);
          
          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'normal');
          const dateWidth = doc.getTextWidth(exp.duration);
          doc.text(exp.duration, 200 - dateWidth, yMain);
          yMain += 6;

          if (exp.description) {
            doc.setTextColor(60, 60, 60);
            const splitDesc = doc.splitTextToSize(exp.description, 110);
            doc.text(splitDesc, marginMain, yMain);
            yMain += splitDesc.length * 5 + 8;
          } else {
            yMain += 8;
          }
        });
      }

      // Projects
      if (projects.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(30, 58, 138);
        doc.setFont('helvetica', 'bold');
        doc.text('PROJECTS', marginMain, yMain);
        yMain += 8;

        projects.forEach(proj => {
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text(proj.title, marginMain, yMain);
          yMain += 5;

          if (proj.link) {
            doc.setFontSize(9);
            doc.setTextColor(30, 58, 138);
            doc.setFont('helvetica', 'normal');
            doc.text(proj.link, marginMain, yMain);
            yMain += 5;
          }

          if (proj.description) {
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);
            const splitDesc = doc.splitTextToSize(proj.description, 110);
            doc.text(splitDesc, marginMain, yMain);
            yMain += splitDesc.length * 5 + 8;
          } else {
            yMain += 5;
          }
        });
      }

      // Volunteering
      if (volunteering.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(30, 58, 138);
        doc.setFont('helvetica', 'bold');
        doc.text('VOLUNTEERING', marginMain, yMain);
        yMain += 8;

        volunteering.forEach(vol => {
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text(`${vol.role} - ${vol.organization}`, marginMain, yMain);
          yMain += 5;
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'normal');
          doc.text(vol.duration, marginMain, yMain);
          yMain += 8;
        });
      }

    } else {
      // --- CLASSIC TEMPLATE ---
      const margin = 20;
      let yPos = 20;

      // Header
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.setFont('times', 'bold');
      doc.text(personalInfo.fullName || 'Your Name', 105, yPos, { align: 'center' });
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.setFont('times', 'normal');
      const contactLine = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin].filter(Boolean).join(' | ');
      doc.text(contactLine, 105, yPos, { align: 'center' });
      yPos += 10;
      
      doc.setDrawColor(0);
      doc.line(margin, yPos, 190, yPos);
      yPos += 10;

      // Summary
      if (summary) {
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont('times', 'bold');
        doc.text('PROFESSIONAL SUMMARY', margin, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont('times', 'normal');
        const splitSummary = doc.splitTextToSize(summary, 170);
        doc.text(splitSummary, margin, yPos);
        yPos += splitSummary.length * 5 + 5;
      }

      // Experience
      if (experiences.length > 0) {
        doc.setFontSize(12);
        doc.setFont('times', 'bold');
        doc.text('EXPERIENCE', margin, yPos);
        yPos += 6;

        experiences.forEach(exp => {
          doc.setFontSize(11);
          doc.setFont('times', 'bold');
          doc.text(exp.role, margin, yPos);
          
          doc.setFontSize(10);
          doc.setFont('times', 'italic');
          const companyInfo = `${exp.company}  •  ${exp.duration}`;
          const textWidth = doc.getTextWidth(companyInfo);
          doc.text(companyInfo, 190 - textWidth, yPos);
          yPos += 5;

          if (exp.description) {
            doc.setFont('times', 'normal');
            const splitDesc = doc.splitTextToSize(exp.description, 170);
            doc.text(splitDesc, margin, yPos);
            yPos += splitDesc.length * 5 + 5;
          } else {
            yPos += 5;
          }
        });
      }

      // Projects
      if (projects.length > 0) {
        doc.setFontSize(12);
        doc.setFont('times', 'bold');
        doc.text('PROJECTS', margin, yPos);
        yPos += 6;

        projects.forEach(proj => {
          doc.setFontSize(11);
          doc.setFont('times', 'bold');
          doc.text(proj.title, margin, yPos);
          yPos += 5;

          if (proj.link) {
            doc.setFontSize(9);
            doc.setFont('times', 'italic');
            doc.text(proj.link, margin, yPos);
            yPos += 4;
          }

          if (proj.description) {
            doc.setFontSize(10);
            doc.setFont('times', 'normal');
            const splitDesc = doc.splitTextToSize(proj.description, 170);
            doc.text(splitDesc, margin, yPos);
            yPos += splitDesc.length * 5 + 5;
          }
        });
      }

      // Education
      if (education.length > 0) {
        doc.setFontSize(12);
        doc.setFont('times', 'bold');
        doc.text('EDUCATION', margin, yPos);
        yPos += 6;

        education.forEach(edu => {
          doc.setFontSize(11);
          doc.text(edu.school, margin, yPos);
          
          doc.setFontSize(10);
          doc.setFont('times', 'normal');
          const eduInfo = `${edu.degree}  •  ${edu.year}`;
          const textWidth = doc.getTextWidth(eduInfo);
          doc.text(eduInfo, 190 - textWidth, yPos);
          yPos += 7;
        });
      }

      // Certifications
      if (certifications.length > 0) {
        doc.setFontSize(12);
        doc.setFont('times', 'bold');
        doc.text('CERTIFICATIONS', margin, yPos);
        yPos += 6;

        certifications.forEach(cert => {
          doc.setFontSize(10);
          doc.setFont('times', 'normal');
          doc.text(`${cert.name} - ${cert.issuer} (${cert.year})`, margin, yPos);
          yPos += 5;
        });
        yPos += 2;
      }

      // Volunteering
      if (volunteering.length > 0) {
        doc.setFontSize(12);
        doc.setFont('times', 'bold');
        doc.text('VOLUNTEERING', margin, yPos);
        yPos += 6;

        volunteering.forEach(vol => {
          doc.setFontSize(10);
          doc.setFont('times', 'normal');
          const volText = `${vol.role} at ${vol.organization} (${vol.duration})`;
          doc.text(volText, margin, yPos);
          yPos += 5;
          if (vol.description) {
             const splitDesc = doc.splitTextToSize(vol.description, 170);
             doc.text(splitDesc, margin, yPos);
             yPos += splitDesc.length * 5;
          }
          yPos += 3;
        });
      }

      // Skills
      if (skills) {
        doc.setFontSize(12);
        doc.setFont('times', 'bold');
        doc.text('SKILLS', margin, yPos);
        yPos += 6;
        
        doc.setFontSize(10);
        doc.setFont('times', 'normal');
        const splitSkills = doc.splitTextToSize(skills, 170);
        doc.text(splitSkills, margin, yPos);
      }

      // Hobbies
      if (hobbies) {
        yPos += 6;
        doc.setFontSize(12);
        doc.setFont('times', 'bold');
        doc.text('HOBBIES', margin, yPos);
        yPos += 6;
        
        doc.setFontSize(10);
        doc.setFont('times', 'normal');
        const splitHobbies = doc.splitTextToSize(hobbies, 170);
        doc.text(splitHobbies, margin, yPos);
      }
    }

    doc.save(`${personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`);
  };

  const downloadJPG = async () => {
    const element = document.getElementById('resume-preview');
    if (!element) return;
    
    try {
      // @ts-ignore
      const html2canvas = (await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm')).default;
      
      // Create a clone to capture full content without scroll issues
      const clone = element.cloneNode(true) as HTMLElement;
      document.body.appendChild(clone);
      
      // Reset styles on clone to ensure A4 dimensions and visibility
      clone.style.position = 'fixed';
      clone.style.top = '0';
      clone.style.left = '0';
      clone.style.width = '210mm';
      clone.style.minHeight = '297mm';
      clone.style.height = 'auto';
      clone.style.zIndex = '-9999';
      clone.style.transform = 'none';
      clone.style.margin = '0';
      clone.style.borderRadius = '0';
      clone.style.boxShadow = 'none';
      
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight
      });
      
      document.body.removeChild(clone);

      const link = document.createElement('a');
      link.download = `${personalInfo.fullName.replace(/\s+/g, '_')}_Resume.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    } catch (error) {
      console.error("JPG generation failed", error);
      alert("Could not generate JPG.");
    }
  };

  return (
    <div className="w-full mx-auto p-2 md:p-4 flex flex-col lg:flex-row gap-4 h-[calc(100vh-65px)] overflow-hidden">
      {/* Left Side: Wizard Form */}
      <div className="w-full lg:w-4/12 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 flex flex-col">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <i className="fas fa-magic text-primary"></i> Resume Builder
            </h2>
            <div className="flex gap-2 flex-wrap justify-end">
               {[1,2,3,4,5,6,7,8,9].map(s => (
                 <div 
                   key={s} 
                   className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                     step === s ? 'bg-primary text-white shadow-lg shadow-blue-200 scale-110' : 
                     step > s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                   }`}
                 >{step > s ? <i className="fas fa-check"></i> : (s > 5 ? '•' : s)}</div>
               ))}
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${(step / 9) * 100}%` }}></div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><i className="fas fa-user-circle"></i> Personal Details</h3>
              <input type="text" placeholder="Full Name" className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" value={personalInfo.fullName} onChange={e => setPersonalInfo({...personalInfo, fullName: e.target.value})} />
              <input type="email" placeholder="Email Address" className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" value={personalInfo.email} onChange={e => setPersonalInfo({...personalInfo, email: e.target.value})} />
              <input type="tel" placeholder="Phone Number" className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" value={personalInfo.phone} onChange={e => setPersonalInfo({...personalInfo, phone: e.target.value})} />
              <input type="text" placeholder="Location (City, Country)" className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" value={personalInfo.location} onChange={e => setPersonalInfo({...personalInfo, location: e.target.value})} />
              <input type="text" placeholder="LinkedIn URL (Optional)" className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" value={personalInfo.linkedin} onChange={e => setPersonalInfo({...personalInfo, linkedin: e.target.value})} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><i className="fas fa-align-left"></i> Professional Summary</h3>
              <p className="text-sm text-gray-500">Write a short summary of your career highlights and goals.</p>
              <textarea rows={6} placeholder="E.g. Experienced software engineer with 5 years of..." className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all" value={summary} onChange={e => setSummary(e.target.value)}></textarea>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><i className="fas fa-briefcase"></i> Experience</h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <input type="text" placeholder="Job Title" className="w-full p-3 border rounded-lg" value={tempExp.role} onChange={e => setTempExp({...tempExp, role: e.target.value})} />
                <input type="text" placeholder="Company Name" className="w-full p-3 border rounded-lg" value={tempExp.company} onChange={e => setTempExp({...tempExp, company: e.target.value})} />
                <input type="text" placeholder="Duration (e.g. Jan 2020 - Present)" className="w-full p-3 border rounded-lg" value={tempExp.duration} onChange={e => setTempExp({...tempExp, duration: e.target.value})} />
                <textarea placeholder="Description of responsibilities..." rows={3} className="w-full p-3 border rounded-lg" value={tempExp.description} onChange={e => setTempExp({...tempExp, description: e.target.value})}></textarea>
                <button onClick={addExperience} className="w-full py-3 bg-white border border-primary text-primary rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm">+ Add Position</button>
              </div>
              <div className="space-y-2">
                {experiences.map((exp, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                    <span className="font-medium">{exp.role} at {exp.company}</span>
                    <button onClick={() => setExperiences(experiences.filter(e => e.id !== exp.id))} className="text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><i className="fas fa-project-diagram"></i> Projects</h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <input type="text" placeholder="Project Title" className="w-full p-3 border rounded-lg" value={tempProject.title} onChange={e => setTempProject({...tempProject, title: e.target.value})} />
                <input type="text" placeholder="Link (GitHub/Live Demo)" className="w-full p-3 border rounded-lg" value={tempProject.link} onChange={e => setTempProject({...tempProject, link: e.target.value})} />
                <textarea placeholder="Project Description..." rows={3} className="w-full p-3 border rounded-lg" value={tempProject.description} onChange={e => setTempProject({...tempProject, description: e.target.value})}></textarea>
                <button onClick={addProject} className="w-full py-3 bg-white border border-primary text-primary rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm">+ Add Project</button>
              </div>
              <div className="space-y-2">
                {projects.map((proj, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                    <span className="font-medium">{proj.title}</span>
                    <button onClick={() => setProjects(projects.filter(p => p.id !== proj.id))} className="text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><i className="fas fa-graduation-cap"></i> Education</h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <input type="text" placeholder="Degree / Certificate" className="w-full p-3 border rounded-lg" value={tempEdu.degree} onChange={e => setTempEdu({...tempEdu, degree: e.target.value})} />
                <input type="text" placeholder="School / University" className="w-full p-3 border rounded-lg" value={tempEdu.school} onChange={e => setTempEdu({...tempEdu, school: e.target.value})} />
                <input type="text" placeholder="Year (e.g. 2022)" className="w-full p-3 border rounded-lg" value={tempEdu.year} onChange={e => setTempEdu({...tempEdu, year: e.target.value})} />
                <button onClick={addEducation} className="w-full py-3 bg-white border border-primary text-primary rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm">+ Add Education</button>
              </div>
              <div className="space-y-2">
                {education.map((edu, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                    <span className="font-medium">{edu.degree} at {edu.school}</span>
                    <button onClick={() => setEducation(education.filter(e => e.id !== edu.id))} className="text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><i className="fas fa-certificate"></i> Certifications</h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <input type="text" placeholder="Certification Name" className="w-full p-3 border rounded-lg" value={tempCert.name} onChange={e => setTempCert({...tempCert, name: e.target.value})} />
                <input type="text" placeholder="Issuing Organization" className="w-full p-3 border rounded-lg" value={tempCert.issuer} onChange={e => setTempCert({...tempCert, issuer: e.target.value})} />
                <input type="text" placeholder="Year" className="w-full p-3 border rounded-lg" value={tempCert.year} onChange={e => setTempCert({...tempCert, year: e.target.value})} />
                <button onClick={addCertification} className="w-full py-3 bg-white border border-primary text-primary rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm">+ Add Certification</button>
              </div>
              <div className="space-y-2">
                {certifications.map((cert, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                    <span className="font-medium">{cert.name}</span>
                    <button onClick={() => setCertifications(certifications.filter(c => c.id !== cert.id))} className="text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><i className="fas fa-hands-helping"></i> Volunteering</h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <input type="text" placeholder="Role" className="w-full p-3 border rounded-lg" value={tempVol.role} onChange={e => setTempVol({...tempVol, role: e.target.value})} />
                <input type="text" placeholder="Organization" className="w-full p-3 border rounded-lg" value={tempVol.organization} onChange={e => setTempVol({...tempVol, organization: e.target.value})} />
                <input type="text" placeholder="Duration" className="w-full p-3 border rounded-lg" value={tempVol.duration} onChange={e => setTempVol({...tempVol, duration: e.target.value})} />
                <textarea placeholder="Description..." rows={2} className="w-full p-3 border rounded-lg" value={tempVol.description} onChange={e => setTempVol({...tempVol, description: e.target.value})}></textarea>
                <button onClick={addVolunteering} className="w-full py-3 bg-white border border-primary text-primary rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm">+ Add Volunteering</button>
              </div>
              <div className="space-y-2">
                {volunteering.map((vol, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                    <span className="font-medium">{vol.role} at {vol.organization}</span>
                    <button onClick={() => setVolunteering(volunteering.filter(v => v.id !== vol.id))} className="text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><i className="fas fa-tools"></i> Skills</h3>
              <p className="text-sm text-gray-500">List your top skills separated by commas.</p>
              <textarea rows={4} placeholder="React, TypeScript, Node.js, Project Management, Communication..." className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all" value={skills} onChange={e => setSkills(e.target.value)}></textarea>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><i className="fas fa-heart"></i> Hobbies & Interests</h3>
              <p className="text-sm text-gray-500">List your hobbies or interests separated by commas.</p>
              <textarea rows={4} placeholder="Photography, Hiking, Chess, Reading..." className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all" value={hobbies} onChange={e => setHobbies(e.target.value)}></textarea>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between pt-4 border-t border-gray-100">
          <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg disabled:opacity-50">Back</button>
          {step < 9 ? (
            <div className="flex gap-2">
              {[4, 6, 7, 9].includes(step) && (
                <button onClick={() => setStep(Math.min(9, step + 1))} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors">Skip</button>
              )}
              <button onClick={() => setStep(Math.min(9, step + 1))} className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark shadow-lg shadow-blue-200 transition-all">Next Step</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={downloadJPG} className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all flex items-center gap-2"><i className="fas fa-image"></i> JPG</button>
              <button onClick={downloadPDF} className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center gap-2"><i className="fas fa-file-pdf"></i> PDF</button>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Live Preview */}
      <div className="w-full lg:w-8/12 bg-gray-200 rounded-2xl p-4 overflow-auto flex justify-center items-start">
        <div className="flex flex-col items-center">
          {/* Template Selector */}
          <div className="bg-white p-2 rounded-full shadow-md mb-6 flex gap-2">
            <button 
              onClick={() => setActiveTemplate('modern')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTemplate === 'modern' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Modern
            </button>
            <button 
              onClick={() => setActiveTemplate('classic')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTemplate === 'classic' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Classic
            </button>
          </div>

        <div id="resume-preview" className={`bg-white w-[210mm] min-h-[297mm] shadow-2xl text-sm leading-relaxed transition-all duration-500 ${activeTemplate === 'modern' ? 'flex' : 'p-[20mm]'}`}>
          
          {activeTemplate === 'classic' ? (
          <>
          {/* Preview Header */}
          <div className="border-b-2 border-gray-200 pb-4 mb-4">
            <h1 className="text-3xl font-bold text-primary mb-1">{personalInfo.fullName || 'Your Name'}</h1>
            <p className="text-gray-600 text-xs">
              {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin].filter(Boolean).join(' | ')}
            </p>
          </div>

          {/* Preview Summary */}
          {summary && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase text-gray-800 border-b border-gray-100 mb-2 pb-1">Professional Summary</h2>
              <p className="text-gray-700 text-xs">{summary}</p>
            </div>
          )}

          {/* Preview Experience */}
          {experiences.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase text-gray-800 border-b border-gray-100 mb-2 pb-1">Experience</h2>
              {experiences.map((exp, i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-gray-800">{exp.role}</h3>
                    <span className="text-xs text-gray-500">{exp.company} | {exp.duration}</span>
                  </div>
                  <p className="text-gray-600 text-xs mt-1 whitespace-pre-wrap break-words">{exp.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Preview Projects */}
          {projects.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase text-gray-800 border-b border-gray-100 mb-2 pb-1">Projects</h2>
              {projects.map((proj, i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-gray-800">{proj.title}</h3>
                    {proj.link && <span className="text-xs text-blue-600">{proj.link}</span>}
                  </div>
                  {proj.description && <p className="text-gray-600 text-xs mt-1 whitespace-pre-wrap break-words">{proj.description}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Preview Education */}
          {education.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase text-gray-800 border-b border-gray-100 mb-2 pb-1">Education</h2>
              {education.map((edu, i) => (
                <div key={i} className="flex justify-between items-baseline mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800">{edu.school}</h3>
                    <p className="text-xs text-gray-600">{edu.degree}</p>
                  </div>
                  <span className="text-xs text-gray-500">{edu.year}</span>
                </div>
              ))}
            </div>
          )}

          {/* Preview Certifications */}
          {certifications.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase text-gray-800 border-b border-gray-100 mb-2 pb-1">Certifications</h2>
              {certifications.map((cert, i) => (
                <div key={i} className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-gray-800 text-xs">{cert.name}</span>
                  <span className="text-xs text-gray-500">{cert.issuer}, {cert.year}</span>
                </div>
              ))}
            </div>
          )}

          {/* Preview Volunteering */}
          {volunteering.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase text-gray-800 border-b border-gray-100 mb-2 pb-1">Volunteering</h2>
              {volunteering.map((vol, i) => (
                <div key={i} className="mb-2">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-gray-800 text-xs">{vol.role}</h3>
                    <span className="text-xs text-gray-500">{vol.organization} | {vol.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Preview Skills */}
          {skills && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase text-gray-800 border-b border-gray-100 mb-2 pb-1">Skills</h2>
              <p className="text-gray-700 text-xs break-words">{skills}</p>
            </div>
          )}

          {/* Preview Hobbies */}
          {hobbies && (
            <div>
              <h2 className="text-sm font-bold uppercase text-gray-800 border-b border-gray-100 mb-2 pb-1">Hobbies</h2>
              <p className="text-gray-700 text-xs break-words">{hobbies}</p>
            </div>
          )}
          </>
          ) : (
            // MODERN TEMPLATE PREVIEW
            <>
              {/* Sidebar */}
              <div className="w-[30%] bg-blue-900 text-white p-6 flex flex-col gap-6">
                <div>
                  <h1 className="text-2xl font-bold mb-4 leading-tight">{personalInfo.fullName || 'Your Name'}</h1>
                  <div className="text-xs text-blue-100 space-y-2 break-words">
                    {personalInfo.email && <div className="break-all"><i className="fas fa-envelope mr-2 w-4"></i>{personalInfo.email}</div>}
                    {personalInfo.phone && <div><i className="fas fa-phone mr-2 w-4"></i>{personalInfo.phone}</div>}
                    {personalInfo.location && <div><i className="fas fa-map-marker-alt mr-2 w-4"></i>{personalInfo.location}</div>}
                    {personalInfo.linkedin && <div className="break-all"><i className="fab fa-linkedin mr-2 w-4"></i>LinkedIn</div>}
                  </div>
                </div>

                {education.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase border-b border-blue-700 pb-1 mb-3">Education</h3>
                    <div className="space-y-4">
                      {education.map((edu, i) => (
                        <div key={i}>
                          <div className="font-bold text-sm">{edu.school}</div>
                          <div className="text-xs text-blue-200">{edu.degree}</div>
                          <div className="text-xs text-blue-300">{edu.year}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {certifications.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase border-b border-blue-700 pb-1 mb-3">Certifications</h3>
                    <div className="space-y-2">
                      {certifications.map((cert, i) => (
                        <div key={i}>
                          <div className="font-bold text-sm">{cert.name}</div>
                          <div className="text-xs text-blue-200">{cert.issuer}, {cert.year}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {skills && (
                  <div>
                    <h3 className="text-sm font-bold uppercase border-b border-blue-700 pb-1 mb-3">Skills</h3>
                    <p className="text-xs text-blue-100 leading-relaxed break-words">{skills}</p>
                  </div>
                )}

                {hobbies && (
                  <div className="mt-6">
                    <h3 className="text-sm font-bold uppercase border-b border-blue-700 pb-1 mb-3">Hobbies</h3>
                    <p className="text-xs text-blue-100 leading-relaxed break-words">{hobbies}</p>
                  </div>
                )}
              </div>

              {/* Main Content */}
              <div className="w-[70%] p-8 bg-white">
                {summary && (
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-blue-900 uppercase mb-3 flex items-center gap-2"><i className="fas fa-user"></i> Profile</h2>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words">{summary}</p>
                  </div>
                )}

                {experiences.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-blue-900 uppercase mb-4 flex items-center gap-2"><i className="fas fa-briefcase"></i> Experience</h2>
                    <div className="space-y-6">
                      {experiences.map((exp, i) => (
                        <div key={i} className="relative pl-4 border-l-2 border-blue-100">
                          <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-500"></div>
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-bold text-gray-800 text-base">{exp.role}</h3>
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{exp.duration}</span>
                          </div>
                          <div className="text-sm text-blue-800 font-medium mb-2">{exp.company}</div>
                          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {projects.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-bold text-blue-900 uppercase mb-4 flex items-center gap-2"><i className="fas fa-project-diagram"></i> Projects</h2>
                    <div className="space-y-4">
                      {projects.map((proj, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-bold text-gray-800 text-base">{proj.title}</h3>
                            {proj.link && <span className="text-xs text-blue-600">{proj.link}</span>}
                          </div>
                          {proj.description && <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap break-words">{proj.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {volunteering.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-bold text-blue-900 uppercase mb-4 flex items-center gap-2"><i className="fas fa-hands-helping"></i> Volunteering</h2>
                    <div className="space-y-4">
                      {volunteering.map((vol, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-bold text-gray-800 text-sm">{vol.role}</h3>
                            <span className="text-xs text-blue-600">{vol.organization} | {vol.duration}</span>
                          </div>
                          {vol.description && <p className="text-gray-600 text-xs mt-1 whitespace-pre-wrap break-words">{vol.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;