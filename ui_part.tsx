const steps = [
    { id: 1, label: 'Personal Details', icon: 'fa-user' },
    { id: 2, label: 'Summary', icon: 'fa-align-left' },
    { id: 3, label: 'Experience', icon: 'fa-briefcase' },
    { id: 4, label: 'Projects', icon: 'fa-project-diagram' },
    { id: 5, label: 'Education', icon: 'fa-graduation-cap' },
    { id: 6, label: 'Certifications', icon: 'fa-certificate' },
    { id: 7, label: 'Volunteering', icon: 'fa-hands-helping' },
    { id: 8, label: 'Skills', icon: 'fa-tools' },
    { id: 9, label: 'Hobbies', icon: 'fa-heart' },
];

return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-slate-950 text-slate-200 overflow-hidden font-sans">

        {/* Left Panel: Editor */}
        <div className={`w-full lg:w-5/12 flex flex-col border-r border-slate-800/50 bg-[#020617] ${showPreviewMobile ? 'hidden' : 'flex'} h-full transition-all duration-300`}>

            {/* Header & Stepper */}
            <div className="p-6 border-b border-slate-800/50 bg-[#020617]/50 backdrop-blur-md z-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <i className="fas fa-file-alt text-white text-sm"></i>
                        </div>
                        Resume Builder
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setStep(Math.max(1, step - 1))}
                            disabled={step === 1}
                            className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <i className="fas fa-chevron-left text-xs"></i>
                        </button>
                        <span className="text-sm font-medium text-slate-400 self-center">
                            {step} / 9
                        </span>
                        <button
                            onClick={() => setStep(Math.min(9, step + 1))}
                            disabled={step === 9}
                            className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <i className="fas fa-chevron-right text-xs"></i>
                        </button>
                    </div>
                </div>

                {/* Horizontal Scrollable Stepper */}
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thumb-slate-800 scrollbar-thin">
                    {steps.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setStep(s.id)}
                            className={`flex flex-col items-center gap-2 min-w-[4.5rem] group transition-all duration-300 ${step === s.id ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-70'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-300 border ${step === s.id
                                ? 'bg-slate-800 border-amber-500/50 text-amber-500 shadow-lg shadow-amber-900/20'
                                : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:border-slate-600'}`}>
                                <i className={`fas ${s.icon}`}></i>
                            </div>
                            <span className={`text-[10px] font-medium uppercase tracking-wider ${step === s.id ? 'text-amber-500' : 'text-slate-500'}`}>
                                {s.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <div className="max-w-2xl mx-auto space-y-6 animate-fade-in relative">

                    {step === 1 && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 text-amber-500 mb-2">
                                <i className="fas fa-user-circle text-xl"></i>
                                <h3 className="text-lg font-semibold text-white">Personal Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                                    <input type="text" placeholder="John Doe" className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:bg-slate-900 outline-none transition-all placeholder:text-slate-600 text-white" value={personalInfo.fullName} onChange={e => setPersonalInfo({ ...personalInfo, fullName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Email</label>
                                    <input type="email" placeholder="john@example.com" className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:bg-slate-900 outline-none transition-all placeholder:text-slate-600 text-white" value={personalInfo.email} onChange={e => setPersonalInfo({ ...personalInfo, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Phone</label>
                                    <input type="tel" placeholder="+1 234 567 890" className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:bg-slate-900 outline-none transition-all placeholder:text-slate-600 text-white" value={personalInfo.phone} onChange={e => setPersonalInfo({ ...personalInfo, phone: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Location</label>
                                    <input type="text" placeholder="New York, USA" className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:bg-slate-900 outline-none transition-all placeholder:text-slate-600 text-white" value={personalInfo.location} onChange={e => setPersonalInfo({ ...personalInfo, location: e.target.value })} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">LinkedIn URL</label>
                                    <input type="text" placeholder="linkedin.com/in/johndoe" className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:bg-slate-900 outline-none transition-all placeholder:text-slate-600 text-white" value={personalInfo.linkedin} onChange={e => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 text-amber-500 mb-2">
                                <i className="fas fa-align-left text-xl"></i>
                                <h3 className="text-lg font-semibold text-white">Professional Summary</h3>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Summary</label>
                                <textarea rows={8} placeholder="Passionate professional with over 5 years of experience in..." className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:bg-slate-900 outline-none resize-none transition-all placeholder:text-slate-600 text-white leading-relaxed" value={summary} onChange={e => setSummary(e.target.value)}></textarea>
                                <p className="text-xs text-slate-500 text-right">Keep it under 3-4 sentences for best impact.</p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-amber-500">
                                    <i className="fas fa-briefcase text-xl"></i>
                                    <h3 className="text-lg font-semibold text-white">Experience</h3>
                                </div>
                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">{experiences.length} Added</span>
                            </div>

                            {/* Add New Form */}
                            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 shadow-lg shadow-black/20">
                                <h4 className="text-sm font-medium text-slate-300 mb-2">Add New Experience</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" placeholder="Job Title" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white" value={tempExp.role} onChange={e => setTempExp({ ...tempExp, role: e.target.value })} />
                                    <input type="text" placeholder="Company" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white" value={tempExp.company} onChange={e => setTempExp({ ...tempExp, company: e.target.value })} />
                                    <input type="text" placeholder="Duration (e.g. 2020 - Present)" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white md:col-span-2" value={tempExp.duration} onChange={e => setTempExp({ ...tempExp, duration: e.target.value })} />
                                    <textarea placeholder="Key responsibilities and achievements..." rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white md:col-span-2 resize-none" value={tempExp.description} onChange={e => setTempExp({ ...tempExp, description: e.target.value })}></textarea>
                                </div>
                                <button onClick={addExperience} className="w-full py-3 bg-amber-600/10 border border-amber-600/20 text-amber-500 rounded-lg font-bold text-sm hover:bg-amber-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group">
                                    <i className="fas fa-plus group-hover:rotate-90 transition-transform"></i> Add Position
                                </button>
                            </div>

                            {/* List */}
                            <div className="space-y-3">
                                {experiences.map((exp, i) => (
                                    <div key={i} className="flex justify-between items-start p-4 bg-slate-900 border border-slate-800 rounded-xl group hover:border-slate-700 transition-colors">
                                        <div>
                                            <h5 className="font-semibold text-white text-sm">{exp.role}</h5>
                                            <p className="text-slate-400 text-xs mt-1">{exp.company} • {exp.duration}</p>
                                        </div>
                                        <button onClick={() => setExperiences(experiences.filter(e => e.id !== exp.id))} className="text-slate-600 hover:text-red-500 transition-colors p-2">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ))}
                                {experiences.length === 0 && (
                                    <div className="text-center py-8 text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-xl">
                                        No experience added yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-amber-500">
                                    <i className="fas fa-project-diagram text-xl"></i>
                                    <h3 className="text-lg font-semibold text-white">Projects</h3>
                                </div>
                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">{projects.length} Added</span>
                            </div>

                            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 shadow-lg shadow-black/20">
                                <h4 className="text-sm font-medium text-slate-300 mb-2">Add New Project</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" placeholder="Project Title" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white" value={tempProject.title} onChange={e => setTempProject({ ...tempProject, title: e.target.value })} />
                                    <input type="text" placeholder="Link (Optional)" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white" value={tempProject.link} onChange={e => setTempProject({ ...tempProject, link: e.target.value })} />
                                    <textarea placeholder="Project details and tech stack used..." rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white md:col-span-2 resize-none" value={tempProject.description} onChange={e => setTempProject({ ...tempProject, description: e.target.value })}></textarea>
                                </div>
                                <button onClick={addProject} className="w-full py-3 bg-amber-600/10 border border-amber-600/20 text-amber-500 rounded-lg font-bold text-sm hover:bg-amber-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group">
                                    <i className="fas fa-plus group-hover:rotate-90 transition-transform"></i> Add Project
                                </button>
                            </div>

                            <div className="space-y-3">
                                {projects.map((proj, i) => (
                                    <div key={i} className="flex justify-between items-start p-4 bg-slate-900 border border-slate-800 rounded-xl group hover:border-slate-700 transition-colors">
                                        <div>
                                            <h5 className="font-semibold text-white text-sm">{proj.title}</h5>
                                            <p className="text-slate-400 text-xs mt-1 truncate max-w-[200px]">{proj.link}</p>
                                        </div>
                                        <button onClick={() => setProjects(projects.filter(p => p.id !== proj.id))} className="text-slate-600 hover:text-red-500 transition-colors p-2">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ))}
                                {projects.length === 0 && (
                                    <div className="text-center py-8 text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-xl">
                                        No projects added yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-amber-500">
                                    <i className="fas fa-graduation-cap text-xl"></i>
                                    <h3 className="text-lg font-semibold text-white">Education</h3>
                                </div>
                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">{education.length} Added</span>
                            </div>

                            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 shadow-lg shadow-black/20">
                                <h4 className="text-sm font-medium text-slate-300 mb-2">Add Education</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <input type="text" placeholder="Degree / Certificate" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white" value={tempEdu.degree} onChange={e => setTempEdu({ ...tempEdu, degree: e.target.value })} />
                                    <input type="text" placeholder="School / University" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white" value={tempEdu.school} onChange={e => setTempEdu({ ...tempEdu, school: e.target.value })} />
                                    <input type="text" placeholder="Year (e.g. 2022)" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white" value={tempEdu.year} onChange={e => setTempEdu({ ...tempEdu, year: e.target.value })} />
                                </div>
                                <button onClick={addEducation} className="w-full py-3 bg-amber-600/10 border border-amber-600/20 text-amber-500 rounded-lg font-bold text-sm hover:bg-amber-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group">
                                    <i className="fas fa-plus group-hover:rotate-90 transition-transform"></i> Add Education
                                </button>
                            </div>

                            <div className="space-y-3">
                                {education.map((edu, i) => (
                                    <div key={i} className="flex justify-between items-start p-4 bg-slate-900 border border-slate-800 rounded-xl group hover:border-slate-700 transition-colors">
                                        <div>
                                            <h5 className="font-semibold text-white text-sm">{edu.degree}</h5>
                                            <p className="text-slate-400 text-xs mt-1">{edu.school} • {edu.year}</p>
                                        </div>
                                        <button onClick={() => setEducation(education.filter(e => e.id !== edu.id))} className="text-slate-600 hover:text-red-500 transition-colors p-2">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ))}
                                {education.length === 0 && (
                                    <div className="text-center py-8 text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-xl">
                                        No education added yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 6 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-amber-500">
                                    <i className="fas fa-certificate text-xl"></i>
                                    <h3 className="text-lg font-semibold text-white">Certifications</h3>
                                </div>
                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">{certifications.length} Added</span>
                            </div>

                            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 shadow-lg shadow-black/20">
                                <div className="grid grid-cols-1 gap-4">
                                    <input type="text" placeholder="Certification Name" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white" value={tempCert.name} onChange={e => setTempCert({ ...tempCert, name: e.target.value })} />
                                    <input type="text" placeholder="Issuer" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white" value={tempCert.issuer} onChange={e => setTempCert({ ...tempCert, issuer: e.target.value })} />
                                    <input type="text" placeholder="Year" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white" value={tempCert.year} onChange={e => setTempCert({ ...tempCert, year: e.target.value })} />
                                </div>
                                <button onClick={addCertification} className="w-full py-3 bg-amber-600/10 border border-amber-600/20 text-amber-500 rounded-lg font-bold text-sm hover:bg-amber-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group">
                                    <i className="fas fa-plus group-hover:rotate-90 transition-transform"></i> Add Certification
                                </button>
                            </div>

                            <div className="space-y-3">
                                {certifications.map((cert, i) => (
                                    <div key={i} className="flex justify-between items-start p-4 bg-slate-900 border border-slate-800 rounded-xl group hover:border-slate-700 transition-colors">
                                        <div>
                                            <h5 className="font-semibold text-white text-sm">{cert.name}</h5>
                                            <p className="text-slate-400 text-xs mt-1">{cert.issuer} • {cert.year}</p>
                                        </div>
                                        <button onClick={() => setCertifications(certifications.filter(c => c.id !== cert.id))} className="text-slate-600 hover:text-red-500 transition-colors p-2">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ))}
                                {certifications.length === 0 && (
                                    <div className="text-center py-8 text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-xl">
                                        No certifications added yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 7 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-amber-500">
                                    <i className="fas fa-hands-helping text-xl"></i>
                                    <h3 className="text-lg font-semibold text-white">Volunteering</h3>
                                </div>
                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">{volunteering.length} Added</span>
                            </div>

                            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 shadow-lg shadow-black/20">
                                <div className="grid grid-cols-1 gap-4">
                                    <input type="text" placeholder="Role" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white" value={tempVol.role} onChange={e => setTempVol({ ...tempVol, role: e.target.value })} />
                                    <input type="text" placeholder="Organization" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white" value={tempVol.organization} onChange={e => setTempVol({ ...tempVol, organization: e.target.value })} />
                                    <input type="text" placeholder="Duration" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white" value={tempVol.duration} onChange={e => setTempVol({ ...tempVol, duration: e.target.value })} />
                                    <textarea placeholder="Description..." rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-white md:col-span-2 resize-none" value={tempVol.description} onChange={e => setTempVol({ ...tempVol, description: e.target.value })}></textarea>
                                </div>
                                <button onClick={addVolunteering} className="w-full py-3 bg-amber-600/10 border border-amber-600/20 text-amber-500 rounded-lg font-bold text-sm hover:bg-amber-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group">
                                    <i className="fas fa-plus group-hover:rotate-90 transition-transform"></i> Add Volunteering
                                </button>
                            </div>

                            <div className="space-y-3">
                                {volunteering.map((vol, i) => (
                                    <div key={i} className="flex justify-between items-start p-4 bg-slate-900 border border-slate-800 rounded-xl group hover:border-slate-700 transition-colors">
                                        <div>
                                            <h5 className="font-semibold text-white text-sm">{vol.role}</h5>
                                            <p className="text-slate-400 text-xs mt-1">{vol.organization} • {vol.duration}</p>
                                        </div>
                                        <button onClick={() => setVolunteering(volunteering.filter(v => v.id !== vol.id))} className="text-slate-600 hover:text-red-500 transition-colors p-2">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ))}
                                {volunteering.length === 0 && (
                                    <div className="text-center py-8 text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-xl">
                                        No volunteering added yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 8 && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 text-amber-500 mb-2">
                                <i className="fas fa-tools text-xl"></i>
                                <h3 className="text-lg font-semibold text-white">Skills</h3>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs text-slate-500">List your skills separated by commas.</p>
                                <textarea rows={6} placeholder="React, TypeScript, Node.js, Project Management, Communication..." className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:bg-slate-900 outline-none resize-none transition-all placeholder:text-slate-600 text-white leading-relaxed" value={skills} onChange={e => setSkills(e.target.value)}></textarea>
                            </div>
                        </div>
                    )}

                    {step === 9 && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 text-amber-500 mb-2">
                                <i className="fas fa-heart text-xl"></i>
                                <h3 className="text-lg font-semibold text-white">Hobbies & Interests</h3>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs text-slate-500">List your hobbies separated by commas.</p>
                                <textarea rows={6} placeholder="Photography, Hiking, Chess, Reading..." className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:bg-slate-900 outline-none resize-none transition-all placeholder:text-slate-600 text-white leading-relaxed" value={hobbies} onChange={e => setHobbies(e.target.value)}></textarea>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-800/50 bg-[#020617]/50 backdrop-blur-md sticky bottom-0 z-10 flex justify-between items-center">
                <button
                    onClick={() => setStep(Math.max(1, step - 1))}
                    disabled={step === 1}
                    className="px-6 py-2.5 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                    Back
                </button>

                <div className="flex gap-3">
                    {step < 9 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-white font-bold shadow-lg shadow-amber-900/30 transition-all transform hover:scale-[1.02] active:scale-95"
                        >
                            Next <i className="fas fa-arrow-right ml-2 text-xs"></i>
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={downloadJPG} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition-all flex items-center gap-2 shadow-lg">
                                <i className="fas fa-image text-amber-500"></i> JPG
                            </button>
                            <button onClick={downloadPDF} className="px-5 py-2.5 rounded-xl bg-white text-slate-950 font-bold hover:bg-gray-100 transition-all flex items-center gap-2 shadow-lg shadow-white/10">
                                <i className="fas fa-file-pdf text-red-500"></i> PDF
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Panel: Live Preview */}
        <div className={`w-full lg:w-7/12 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-900/50 relative overflow-hidden flex flex-col items-center justify-center p-8 ${showPreviewMobile ? 'flex fixed inset-0 z-50 bg-slate-950' : 'hidden lg:flex'}`}>

            {/* Preview Toolbar */}
            <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
                <div className="bg-slate-950/80 backdrop-blur-xl p-1.5 rounded-full border border-slate-800 flex gap-1 shadow-2xl">
                    <button
                        onClick={() => setActiveTemplate('modern')}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTemplate === 'modern' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        Modern
                    </button>
                    <button
                        onClick={() => setActiveTemplate('classic')}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTemplate === 'classic' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        Classic
                    </button>
                </div>
                {showPreviewMobile && (
                    <button onClick={() => setShowPreviewMobile(false)} className="bg-slate-800 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-slate-700">
                        <i className="fas fa-times"></i>
                    </button>
                )}
            </div>

            {/* The Resume Document - Scaled to fit */}
            <div className="w-full h-full overflow-auto flex items-center justify-center px-4 py-20 lg:py-16 scrollbar-hide">
                <div className="scale-[0.5] sm:scale-[0.6] md:scale-[0.7] lg:scale-[0.85] xl:scale-[0.85] origin-center transition-all duration-500 shadow-2xl shadow-black rounded-sm overflow-hidden">
                    <div id="resume-preview" className={`bg-white text-black w-[210mm] min-h-[297mm] h-auto shadow-xl ${activeTemplate === 'modern' ? 'flex' : 'p-[20mm]'}`}>
                        {/* CONTENT UNCHANGED FROM ORIGINAL LOGIC - JUST RENDERING */}
                        {activeTemplate === 'classic' ? (
                            <>
                                {/* Preview Header */}
                                <div className="border-b-2 border-gray-800 pb-4 mb-6">
                                    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2 tracking-tight text-center">{personalInfo.fullName || 'Your Name'}</h1>
                                    <p className="text-gray-600 text-sm text-center font-serif italic">
                                        {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin].filter(Boolean).join(' | ')}
                                    </p>
                                </div>

                                {/* Preview Summary */}
                                {summary && (
                                    <div className="mb-6">
                                        <h2 className="text-sm font-bold uppercase text-gray-900 border-b-2 border-gray-900 mb-3 pb-1 tracking-wider">Professional Summary</h2>
                                        <p className="text-gray-700 text-sm leading-relaxed font-serif">{summary}</p>
                                    </div>
                                )}

                                {/* Preview Experience */}
                                {experiences.length > 0 && (
                                    <div className="mb-6">
                                        <h2 className="text-sm font-bold uppercase text-gray-900 border-b-2 border-gray-900 mb-3 pb-1 tracking-wider">Experience</h2>
                                        {experiences.map((exp, i) => (
                                            <div key={i} className="mb-4">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h3 className="font-bold text-gray-900 text-lg font-serif">{exp.role}</h3>
                                                    <span className="text-sm text-gray-600 italic font-serif">{exp.company}, {exp.duration}</span>
                                                </div>
                                                <p className="text-gray-700 text-sm leading-relaxed font-serif whitespace-pre-wrap">{exp.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Preview Projects */}
                                {projects.length > 0 && (
                                    <div className="mb-6">
                                        <h2 className="text-sm font-bold uppercase text-gray-900 border-b-2 border-gray-900 mb-3 pb-1 tracking-wider">Projects</h2>
                                        {projects.map((proj, i) => (
                                            <div key={i} className="mb-3">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h3 className="font-bold text-gray-900 font-serif">{proj.title}</h3>
                                                    {proj.link && <span className="text-xs text-blue-800 italic">{proj.link}</span>}
                                                </div>
                                                {proj.description && <p className="text-gray-700 text-sm leading-relaxed font-serif">{proj.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Preview Education */}
                                {education.length > 0 && (
                                    <div className="mb-6">
                                        <h2 className="text-sm font-bold uppercase text-gray-900 border-b-2 border-gray-900 mb-3 pb-1 tracking-wider">Education</h2>
                                        {education.map((edu, i) => (
                                            <div key={i} className="flex justify-between items-baseline mb-2">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 font-serif">{edu.school}</h3>
                                                    <p className="text-sm text-gray-700 italic">{edu.degree}</p>
                                                </div>
                                                <span className="text-sm text-gray-600 font-serif">{edu.year}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Preview Certifications */}
                                {certifications.length > 0 && (
                                    <div className="mb-6">
                                        <h2 className="text-sm font-bold uppercase text-gray-900 border-b-2 border-gray-900 mb-3 pb-1 tracking-wider">Certifications</h2>
                                        {certifications.map((cert, i) => (
                                            <div key={i} className="flex justify-between items-baseline mb-1">
                                                <span className="font-bold text-gray-900 text-sm font-serif">{cert.name}</span>
                                                <span className="text-sm text-gray-600 italic">{cert.issuer}, {cert.year}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Preview Volunteering */}
                                {volunteering.length > 0 && (
                                    <div className="mb-6">
                                        <h2 className="text-sm font-bold uppercase text-gray-900 border-b-2 border-gray-900 mb-3 pb-1 tracking-wider">Volunteering</h2>
                                        {volunteering.map((vol, i) => (
                                            <div key={i} className="mb-2">
                                                <div className="flex justify-between items-baseline">
                                                    <h3 className="font-bold text-gray-900 text-sm font-serif">{vol.role}</h3>
                                                    <span className="text-sm text-gray-600 italic">{vol.organization} | {vol.duration}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Preview Skills */}
                                {skills && (
                                    <div className="mb-6">
                                        <h2 className="text-sm font-bold uppercase text-gray-900 border-b-2 border-gray-900 mb-3 pb-1 tracking-wider">Skills</h2>
                                        <p className="text-gray-700 text-sm leading-relaxed font-serif">{skills}</p>
                                    </div>
                                )}

                                {/* Preview Hobbies */}
                                {hobbies && (
                                    <div>
                                        <h2 className="text-sm font-bold uppercase text-gray-900 border-b-2 border-gray-900 mb-3 pb-1 tracking-wider">Hobbies</h2>
                                        <p className="text-gray-700 text-sm leading-relaxed font-serif">{hobbies}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            // MODERN TEMPLATE PREVIEW
                            <>
                                {/* Sidebar */}
                                <div className="w-[32%] bg-[#1e3a8a] text-white p-8 flex flex-col gap-6">
                                    <div>
                                        <h1 className="text-3xl font-bold mb-4 leading-tight tracking-tight">{personalInfo.fullName || 'Your Name'}</h1>
                                        <div className="text-xs text-blue-100 space-y-3">
                                            {personalInfo.email && <div className="flex items-center gap-2"><i className="fas fa-envelope w-4"></i><span className="break-all">{personalInfo.email}</span></div>}
                                            {personalInfo.phone && <div className="flex items-center gap-2"><i className="fas fa-phone w-4"></i>{personalInfo.phone}</div>}
                                            {personalInfo.location && <div className="flex items-center gap-2"><i className="fas fa-map-marker-alt w-4"></i>{personalInfo.location}</div>}
                                            {personalInfo.linkedin && <div className="flex items-center gap-2"><i className="fab fa-linkedin w-4"></i><span className="break-all">LinkedIn Profile</span></div>}
                                        </div>
                                    </div>

                                    {education.length > 0 && (
                                        <div className="mt-4">
                                            <h3 className="text-xs font-bold uppercase border-b border-blue-500/50 pb-2 mb-3 tracking-widest text-blue-200">Education</h3>
                                            <div className="space-y-4">
                                                {education.map((edu, i) => (
                                                    <div key={i}>
                                                        <div className="font-bold text-sm text-white">{edu.school}</div>
                                                        <div className="text-xs text-blue-200 font-medium">{edu.degree}</div>
                                                        <div className="text-xs text-blue-300 mt-0.5">{edu.year}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {certifications.length > 0 && (
                                        <div className="mt-2">
                                            <h3 className="text-xs font-bold uppercase border-b border-blue-500/50 pb-2 mb-3 tracking-widest text-blue-200">Certifications</h3>
                                            <div className="space-y-3">
                                                {certifications.map((cert, i) => (
                                                    <div key={i}>
                                                        <div className="font-bold text-sm text-white">{cert.name}</div>
                                                        <div className="text-xs text-blue-200">{cert.issuer}, {cert.year}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {skills && (
                                        <div className="mt-2">
                                            <h3 className="text-xs font-bold uppercase border-b border-blue-500/50 pb-2 mb-3 tracking-widest text-blue-200">Skills</h3>
                                            <p className="text-xs text-blue-100 leading-relaxed font-light">{skills}</p>
                                        </div>
                                    )}

                                    {hobbies && (
                                        <div className="mt-2">
                                            <h3 className="text-xs font-bold uppercase border-b border-blue-500/50 pb-2 mb-3 tracking-widest text-blue-200">Hobbies</h3>
                                            <p className="text-xs text-blue-100 leading-relaxed font-light">{hobbies}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Main Content */}
                                <div className="w-[68%] p-8 bg-white text-gray-800">
                                    {summary && (
                                        <div className="mb-8">
                                            <h2 className="text-lg font-bold text-[#1e3a8a] uppercase mb-3 flex items-center gap-2 tracking-wide border-b-2 border-gray-100 pb-2">Profile</h2>
                                            <p className="text-gray-600 text-sm leading-relaxed text-justify">{summary}</p>
                                        </div>
                                    )}

                                    {experiences.length > 0 && (
                                        <div>
                                            <h2 className="text-lg font-bold text-[#1e3a8a] uppercase mb-4 flex items-center gap-2 tracking-wide border-b-2 border-gray-100 pb-2">Experience</h2>
                                            <div className="space-y-6">
                                                {experiences.map((exp, i) => (
                                                    <div key={i} className="relative pl-0">
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <h3 className="font-bold text-gray-900 text-lg">{exp.role}</h3>
                                                            <span className="text-xs font-bold text-[#1e3a8a] bg-blue-50 px-2 py-1 rounded">{exp.duration}</span>
                                                        </div>
                                                        <div className="text-sm text-[#1e3a8a] font-semibold mb-2">{exp.company}</div>
                                                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {projects.length > 0 && (
                                        <div className="mt-8">
                                            <h2 className="text-lg font-bold text-[#1e3a8a] uppercase mb-4 flex items-center gap-2 tracking-wide border-b-2 border-gray-100 pb-2">Projects</h2>
                                            <div className="space-y-4">
                                                {projects.map((proj, i) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between items-baseline">
                                                            <h3 className="font-bold text-gray-900 text-base">{proj.title}</h3>
                                                            {proj.link && <span className="text-xs text-blue-600 font-medium">{proj.link}</span>}
                                                        </div>
                                                        {proj.description && <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{proj.description}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {volunteering.length > 0 && (
                                        <div className="mt-8">
                                            <h2 className="text-lg font-bold text-[#1e3a8a] uppercase mb-4 flex items-center gap-2 tracking-wide border-b-2 border-gray-100 pb-2">Volunteering</h2>
                                            <div className="space-y-4">
                                                {volunteering.map((vol, i) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between items-baseline">
                                                            <h3 className="font-bold text-gray-900 text-sm">{vol.role}</h3>
                                                            <span className="text-xs text-[#1e3a8a] font-medium">{vol.organization} | {vol.duration}</span>
                                                        </div>
                                                        {vol.description && <p className="text-gray-600 text-xs mt-1 whitespace-pre-wrap">{vol.description}</p>}
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

        {/* Floating Action Button for Mobile */}
        <button
            onClick={() => setShowPreviewMobile(!showPreviewMobile)}
            className="lg:hidden fixed bottom-6 right-6 z-50 bg-amber-500 text-slate-950 p-4 rounded-full shadow-xl shadow-amber-500/20 hover:scale-110 transition-all border border-amber-400"
        >
            {showPreviewMobile ? <i className="fas fa-edit text-xl"></i> : <i className="fas fa-eye text-xl"></i>}
        </button>

    </div>
);
};

export default ResumeBuilder;
