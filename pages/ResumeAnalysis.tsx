import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
// Using a stable CDN version to ensure worker compatibility without complex build config
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

const ResumeAnalysis: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [fileName, setFileName] = useState('');

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
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Resume Analysis</h1>
      <p className="text-gray-500 mb-8">Upload your resume and the job description to get an instant ATS score and improvement tips.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><i className="fas fa-file-upload text-primary"></i> Upload Resume</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary transition-colors bg-gray-50">
              <input type="file" accept=".pdf,.txt" onChange={handleFileUpload} className="hidden" id="resume-upload" />
              <label htmlFor="resume-upload" className="cursor-pointer block">
                <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
                <p className="text-gray-600 font-medium">{fileName || "Click to upload PDF or Text file"}</p>
                <p className="text-xs text-gray-400 mt-2">Supported formats: PDF, TXT</p>
              </label>
            </div>
            {resumeText && <p className="text-green-600 text-sm mt-3"><i className="fas fa-check-circle"></i> Resume text extracted successfully</p>}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><i className="fas fa-briefcase text-primary"></i> Job Description</h3>
            <textarea 
              className="w-full h-48 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none text-sm"
              placeholder="Paste the job description here..."
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
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
              <i className="fas fa-chart-pie text-6xl mb-4"></i>
              <p>Analysis results will appear here</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Match Score</h2>
                  <p className="text-gray-500 text-sm">Based on keywords & skills</p>
                </div>
                <div className={`text-5xl font-extrabold ${result.score >= 70 ? 'text-green-600' : result.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {result.score}%
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-2"><i className="fas fa-info-circle mr-2"></i>Summary</h4>
                <p className="text-blue-900 text-sm leading-relaxed">{result.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><h4 className="font-bold text-green-700 mb-2"><i className="fas fa-check mr-2"></i>Strengths</h4><ul className="list-disc list-inside text-sm text-gray-600 space-y-1">{result.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></div>
                <div><h4 className="font-bold text-red-600 mb-2"><i className="fas fa-exclamation-triangle mr-2"></i>Weaknesses</h4><ul className="list-disc list-inside text-sm text-gray-600 space-y-1">{result.weaknesses?.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></div>
              </div>

              <div><h4 className="font-bold text-orange-600 mb-2"><i className="fas fa-key mr-2"></i>Missing Keywords</h4><div className="flex flex-wrap gap-2">{result.missingKeywords?.map((k: string, i: number) => <span key={i} className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-medium border border-orange-100">{k}</span>)}</div></div>

              <div><h4 className="font-bold text-purple-700 mb-2"><i className="fas fa-lightbulb mr-2"></i>Improvement Tips</h4><ul className="space-y-2">{result.improvementTips?.map((tip: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><i className="fas fa-angle-right text-purple-400 mt-1"></i><span>{tip}</span></li>)}</ul></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysis;