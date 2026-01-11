import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

// Initialize PDF.js worker
// Using a stable CDN version to ensure worker compatibility without complex build config
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

const ResumeAnalysis: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [fileName, setFileName] = useState('');
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [fetchingLinkedin, setFetchingLinkedin] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const now = Timestamp.now();
        const q = query(collection(db, 'jobs'), where('applyDeadline', '>', now), orderBy('applyDeadline', 'asc'));
        const snap = await getDocs(q);
        setAvailableJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching jobs:", err);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = availableJobs.filter(job => 
    (job.title || '').toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
    (job.companyName || '').toLowerCase().includes(jobSearchTerm.toLowerCase())
  );

  const handleJobSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const jobId = e.target.value;
    if (!jobId) return;
    const job = availableJobs.find(j => j.id === jobId);
    if (job) {
      const fullDescription = `
Job Title: ${job.title}
Company: ${job.companyName}
Required Skills: ${job.skills || ''}
Qualifications: ${job.qualifications || ''}

Job Description:
${job.description || ''}`.trim();
      setJobDesc(fullDescription);
    }
  };

  const fetchLinkedinJob = async () => {
    if (!linkedinUrl) return;
    setFetchingLinkedin(true);
    try {
      // 1. Extract Job ID to construct a clean public URL
      // This helps avoid login walls often encountered with search URLs
      let targetUrl = linkedinUrl;
      const jobIdMatch = linkedinUrl.match(/currentJobId=(\d+)/) || 
                         linkedinUrl.match(/jobs\/view\/(\d+)/);
      if (jobIdMatch && jobIdMatch[1]) {
        targetUrl = `https://www.linkedin.com/jobs/view/${jobIdMatch[1]}/`;
      }

      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&disableCache=true`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (!data.contents) {
        throw new Error("Failed to retrieve page content via proxy.");
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, "text/html");

      // Strategy 1: JSON-LD (Structured Data)
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      let jobData = null;

      for (let i = 0; i < scripts.length; i++) {
        try {
          const json = JSON.parse(scripts[i].textContent || '{}');
          if (json['@type'] === 'JobPosting') {
            jobData = json;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      let title = '';
      let company = '';
      let description = '';

      if (jobData) {
        title = jobData.title || '';
        company = jobData.hiringOrganization?.name || '';
        // Description often contains HTML tags, strip them
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = jobData.description || '';
        description = tempDiv.textContent || tempDiv.innerText || '';
      } else {
        // Strategy 2: DOM Selectors (Updated for public view)
        title = doc.querySelector('.top-card-layout__title')?.textContent?.trim() || 
                doc.querySelector('h1')?.textContent?.trim() || 
                doc.title || '';
        
        company = doc.querySelector('.top-card-layout__first-subline .topcard__org-name-link')?.textContent?.trim() ||
                  doc.querySelector('.top-card-layout__company-url')?.textContent?.trim() || '';

        const descElement = doc.querySelector('.show-more-less-html__markup') || 
                            doc.querySelector('.description__text') ||
                            doc.querySelector('.job-description') ||
                            doc.querySelector('#job-details');
                            
        if (descElement) {
           // Convert HTML breaks to newlines for better text extraction
           const htmlContent = descElement.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n');
           const tempDiv = document.createElement('div');
           tempDiv.innerHTML = htmlContent;
           description = tempDiv.textContent || tempDiv.innerText || '';
        }
      }

      const fullDesc = `Job Title: ${title}
Company: ${company}

Job Description:
${description}`.trim();

      setJobDesc(fullDesc);
    } catch (error: any) {
      console.error("LinkedIn Fetch Error:", error);
      alert("Could not fetch actual job data. LinkedIn might be blocking the request. Please copy/paste the description manually.");
    } finally {
      setFetchingLinkedin(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + ' ';
        }
        setResumeText(fullText);
      } catch (error) {
        console.error("PDF Error:", error);
        alert("Could not parse PDF. Please copy and paste the text instead.");
      }
    } else {
      // Text file
      const text = await file.text();
      setResumeText(text);
    }
  };

  const analyzeResume = async () => {
    if (!resumeText || !jobDesc) {
      alert("Please provide both resume content and job description.");
      return;
    }
    setLoading(true);
    
    try {
      // Keyword Matching Algorithm (No AI API required)
      const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'that', 'this', 'these', 'those', 'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i', 'me', 'my', 'your', 'his', 'her', 'their', 'our', 'us', 'as', 'if', 'than', 'then', 'when', 'where', 'why', 'how', 'what', 'who', 'which', 'not', 'no', 'yes', 'so', 'too', 'very', 'just', 'now', 'job', 'description', 'resume', 'experience', 'work', 'years', 'skills', 'requirements', 'qualifications', 'responsibilities', 'role', 'position', 'candidate', 'applicant', 'company', 'team', 'business', 'project', 'projects', 'etc', 'eg', 'ie']);

      const tokenize = (text: string) => {
        return text.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 2 && !stopWords.has(word));
      };

      const jobTokens = new Set(tokenize(jobDesc));
      const resumeTokens = new Set(tokenize(resumeText));

      const matchedKeywords: string[] = [];
      const missingKeywords: string[] = [];

      jobTokens.forEach(token => {
        if (resumeTokens.has(token)) {
          matchedKeywords.push(token);
        } else {
          missingKeywords.push(token);
        }
      });

      const totalJobKeywords = jobTokens.size;
      const matchCount = matchedKeywords.length;
      let score = 0;
      if (totalJobKeywords > 0) {
        score = Math.round((matchCount / totalJobKeywords) * 100);
      }

      // Generate analysis based on score
      let summary = "";
      const improvementTips: string[] = [];

      if (score >= 70) {
        summary = "Excellent match! Your resume contains a high percentage of the keywords found in the job description.";
        improvementTips.push("Prepare for behavioral interview questions.");
        improvementTips.push("Highlight specific achievements related to the matched skills.");
      } else if (score >= 40) {
        summary = "Good match. You have a solid foundation, but some key qualifications might be missing or phrased differently.";
        improvementTips.push("Try to incorporate more specific keywords from the job description.");
        improvementTips.push("Review the missing keywords list and see if you have those skills.");
      } else {
        summary = "Low match. There seems to be a significant gap between your resume and the job description keywords.";
        improvementTips.push("Tailor your resume specifically for this role.");
        improvementTips.push("Ensure you are using the exact terminology found in the job description.");
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 800));

      setResult({
        score,
        summary,
        strengths: matchedKeywords.slice(0, 15),
        weaknesses: missingKeywords.slice(0, 5).map(k => `Missing: ${k}`),
        missingKeywords: missingKeywords.slice(0, 20),
        improvementTips
      });

    } catch (error: any) {
      console.error(error);
      alert("Analysis failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">AI Resume Analysis</h1>
      <p className="text-gray-500 dark:text-slate-400 mb-8">Upload your resume and the job description to get an instant ATS score and improvement tips.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-black/80 backdrop-blur-sm p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><i className="fas fa-file-upload text-primary"></i> Upload Resume</h3>
            <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-primary dark:hover:border-primary transition-colors bg-gray-50 dark:bg-slate-800/50">
              <input type="file" accept=".pdf,.txt" onChange={handleFileUpload} className="hidden" id="resume-upload" />
              <label htmlFor="resume-upload" className="cursor-pointer block">
                <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 dark:text-slate-500 mb-3"></i>
                <p className="text-gray-600 dark:text-slate-300 font-medium">{fileName || "Click to upload PDF or Text file"}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">Supported formats: PDF, TXT</p>
              </label>
            </div>
            {resumeText && <p className="text-green-600 text-sm mt-3"><i className="fas fa-check-circle"></i> Resume text extracted successfully</p>}
          </div>

          <div className="bg-white dark:bg-black/80 backdrop-blur-sm p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><i className="fas fa-briefcase text-primary"></i> Job Description</h3>
            
            <div className="mb-3 space-y-2">
              <input 
                type="text" 
                placeholder="Search available jobs..." 
                className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                value={jobSearchTerm}
                onChange={(e) => setJobSearchTerm(e.target.value)}
              />
              <select 
                className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white dark:bg-slate-950 dark:text-white cursor-pointer"
                onChange={handleJobSelect}
                defaultValue=""
              >
                <option value="" disabled>Select a job to auto-fill description (Optional)</option>
                {filteredJobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title} at {job.companyName}</option>
                ))}
              </select>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <i className="fab fa-linkedin absolute left-3 top-1/2 -translate-y-1/2 text-blue-700"></i>
                  <input 
                    type="text" 
                    placeholder="Paste LinkedIn Job URL..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                  />
                </div>
                <button 
                  onClick={fetchLinkedinJob}
                  disabled={fetchingLinkedin || !linkedinUrl}
                  className="px-4 py-2 bg-[#0077b5] hover:bg-[#006396] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {fetchingLinkedin ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-download"></i> Fetch</>}
                </button>
              </div>
            </div>

            <textarea 
              className="w-full h-48 p-4 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none text-sm bg-white dark:bg-slate-950 dark:text-white dark:placeholder-slate-500"
              placeholder="Paste the job description here or select a job above..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            ></textarea>
          </div>

          <button 
            onClick={analyzeResume}
            disabled={loading || !resumeText || !jobDesc}
            className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <span className="flex items-center justify-center gap-2"><i className="fas fa-spinner fa-spin"></i> Analyzing...</span> : "Analyze Resume"}
          </button>
        </div>

        {/* Results Section */}
        <div className="bg-white dark:bg-black/80 backdrop-blur-sm p-4 md:p-8 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 min-h-[500px]">
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-600 opacity-50">
              <i className="fas fa-chart-pie text-6xl mb-4"></i>
              <p>Analysis results will appear here</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Match Score</h2>
                  <p className="text-gray-500 dark:text-slate-400 text-sm">Based on keywords & skills</p>
                </div>
                <div className={`text-5xl font-extrabold ${result.score >= 70 ? 'text-green-600' : result.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {result.score}%
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2"><i className="fas fa-info-circle mr-2"></i>Summary</h4>
                <p className="text-blue-900 dark:text-blue-200 text-sm leading-relaxed">{result.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><h4 className="font-bold text-green-700 dark:text-green-400 mb-2"><i className="fas fa-check mr-2"></i>Strengths</h4><ul className="list-disc list-inside text-sm text-gray-600 dark:text-slate-300 space-y-1">{result.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></div>
                <div><h4 className="font-bold text-red-600 dark:text-red-400 mb-2"><i className="fas fa-exclamation-triangle mr-2"></i>Weaknesses</h4><ul className="list-disc list-inside text-sm text-gray-600 dark:text-slate-300 space-y-1">{result.weaknesses?.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></div>
              </div>

              <div><h4 className="font-bold text-orange-600 dark:text-orange-400 mb-2"><i className="fas fa-key mr-2"></i>Missing Keywords</h4><div className="flex flex-wrap gap-2">{result.missingKeywords?.map((k: string, i: number) => <span key={i} className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-medium border border-orange-100 dark:border-orange-800">{k}</span>)}</div></div>

              <div><h4 className="font-bold text-purple-700 dark:text-purple-400 mb-2"><i className="fas fa-lightbulb mr-2"></i>Improvement Tips</h4><ul className="space-y-2">{result.improvementTips?.map((tip: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300"><i className="fas fa-angle-right text-purple-400 mt-1"></i><span>{tip}</span></li>)}</ul></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysis;