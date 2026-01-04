import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 selection:bg-primary selection:text-white">
      {/* Navbar */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 transition-all duration-300">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <img src="https://i.ibb.co/3y9DKsB6/Yellow-and-Black-Illustrative-Education-Logo-1.png" alt="InterviewXpert Logo" className="w-14 h-14 rounded-xl object-cover" />
              <span className="font-bold text-xl tracking-tight text-gray-900">InterviewXpert</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary font-medium transition hover:-translate-y-0.5">Features</a>
              <a href="#process" className="text-gray-600 hover:text-primary font-medium transition hover:-translate-y-0.5">Process</a>
              <Link to="/auth" className="text-gray-600 hover:text-primary font-medium transition">Dashboard</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth" className="hidden md:block text-gray-600 hover:text-primary font-medium">Log in</Link>
              <Link to="/auth" className="bg-primary text-white px-6 py-2.5 rounded-full hover:bg-primary-dark transition-all shadow-lg shadow-blue-200 font-medium hover:shadow-xl hover:-translate-y-0.5">
                Start Interview
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-gradient-to-b from-white via-blue-50 to-white">
         {/* Background Elements */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-200/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
         </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-100 shadow-sm text-primary text-sm font-semibold mb-8 animate-bounce">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              New: AI Resume Builder & Analysis
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight">
              Master Your Next <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-600 to-primary bg-300% animate-pulse">Interview with AI</span>
            </h1>
            <p className="mt-4 text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              From building a perfect resume to mastering the interview. <br className="hidden md:block"/>
              Our fully automated AI platform prepares you for your dream job.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth" className="px-8 py-4 bg-primary text-white rounded-full font-bold text-lg hover:bg-primary-dark transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 flex items-center justify-center gap-2">
                <i className="fa-solid fa-rocket"></i> Start Practicing Free
              </Link>
              <Link to="/auth" className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-all hover:shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2">
                <i className="fa-solid fa-chart-line"></i> View Demo
              </Link>
            </div>
            
            <div className="mt-16 pt-8 border-t border-gray-200/60">
               <p className="text-sm text-gray-400 font-medium mb-6 uppercase tracking-widest">Trusted by candidates applying to</p>
               <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                  <i className="fab fa-google text-3xl hover:text-[#4285F4] transition-colors cursor-pointer"></i>
                  <i className="fab fa-microsoft text-3xl hover:text-[#00a4ef] transition-colors cursor-pointer"></i>
                  <i className="fab fa-amazon text-3xl hover:text-[#FF9900] transition-colors cursor-pointer"></i>
                  <i className="fab fa-meta text-3xl hover:text-[#0668E1] transition-colors cursor-pointer"></i>
                  <i className="fab fa-apple text-3xl hover:text-[#000000] transition-colors cursor-pointer"></i>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-2">All-in-One Platform</h2>
            <p className="text-4xl font-extrabold text-gray-900">
              Complete Career Acceleration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {/* Feature 1 */}
             <div className="group relative bg-gray-50 rounded-3xl p-8 hover:bg-blue-600 transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl text-blue-600 mb-6 shadow-sm group-hover:scale-110 transition-transform">
                   <i className="fa-solid fa-file-pen"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-white">AI Resume Builder</h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-blue-100">
                   Create professional, ATS-friendly resumes in minutes. Choose from modern templates and let AI suggest improvements.
                </p>
             </div>

             {/* Feature 2 */}
             <div className="group relative bg-gray-50 rounded-3xl p-8 hover:bg-purple-600 transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl text-purple-600 mb-6 shadow-sm group-hover:scale-110 transition-transform">
                   <i className="fa-solid fa-magnifying-glass-chart"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-white">Smart Resume Analysis</h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-purple-100">
                   Get instant feedback on your resume. Our AI scores your resume against job descriptions and highlights missing keywords.
                </p>
             </div>

             {/* Feature 3 */}
             <div className="group relative bg-gray-50 rounded-3xl p-8 hover:bg-orange-500 transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl text-orange-500 mb-6 shadow-sm group-hover:scale-110 transition-transform">
                   <i className="fa-solid fa-video"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-white">AI Mock Interviews</h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-orange-100">
                   Practice with a fully automated AI interviewer that adapts to your responses and provides real-time performance metrics.
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* How It Works / Process */}
      <section id="process" className="py-24 bg-gray-900 text-white overflow-hidden">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-16">
               <div className="w-full md:w-1/2">
                  <h2 className="text-4xl font-bold mb-6">Your Path to Success</h2>
                  <p className="text-gray-400 text-lg mb-8">
                     Stop guessing and start preparing with data-driven insights. Our platform guides you through every step of the recruitment process.
                  </p>
                  
                  <div className="space-y-8">
                     <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-500/30">1</div>
                        <div>
                           <h4 className="text-xl font-bold mb-2">Build & Optimize</h4>
                           <p className="text-gray-400">Create a standout resume using our builder and check its ATS score.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xl border border-purple-500/30">2</div>
                        <div>
                           <h4 className="text-xl font-bold mb-2">Practice Interviews</h4>
                           <p className="text-gray-400">Take role-specific AI interviews with real-time voice and video analysis.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xl border border-green-500/30">3</div>
                        <div>
                           <h4 className="text-xl font-bold mb-2">Get Hired</h4>
                           <p className="text-gray-400">Apply to top jobs with confidence and track your application status.</p>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="w-full md:w-1/2 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-2xl opacity-30 animate-pulse"></div>
                  <div className="relative bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
                     {/* Mock UI Element */}
                     <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-3 h-3 rounded-full bg-red-500"></div>
                           <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                           <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="text-gray-500 text-xs">AI Analysis Report</div>
                     </div>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center">
                           <span className="text-gray-300">Overall Score</span>
                           <span className="text-green-400 font-bold text-xl">92/100</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                           <div className="bg-green-500 h-2 rounded-full" style={{width: '92%'}}></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                           <div className="bg-gray-700/50 p-3 rounded-lg">
                              <div className="text-xs text-gray-400">Communication</div>
                              <div className="text-blue-400 font-bold">Excellent</div>
                           </div>
                           <div className="bg-gray-700/50 p-3 rounded-lg">
                              <div className="text-xs text-gray-400">Technical</div>
                              <div className="text-purple-400 font-bold">Strong</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="https://i.ibb.co/3y9DKsB6/Yellow-and-Black-Illustrative-Education-Logo-1.png" alt="Logo" className="w-12 h-12 rounded-xl" />
              <span className="font-bold text-xl">InterviewXpert</span>
            </div>
            
            <div className="text-center md:text-right">
              <div className="text-gray-400 text-sm mb-2 font-medium">
                Developed & Designed by
              </div>
              <div className="flex flex-wrap justify-center md:justify-end items-center gap-x-2 text-sm text-gray-300">
                {/* Aaradhya Pathak with Hover Effect */}
                <div className="relative group inline-block cursor-pointer">
                  <span className="font-bold text-blue-400 hover:text-blue-300 transition-colors border-b border-dashed border-blue-400/50 pb-0.5">Aaradhya Pathak</span>
                  
                  {/* Hover Card */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 bg-white text-gray-800 p-5 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform group-hover:-translate-y-2 border border-gray-100">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3">
                        <div className="absolute inset-0 bg-primary rounded-full blur opacity-40"></div>
                        <img 
                          src="https://i.ibb.co/hxk52kkC/Whats-App-Image-2025-03-21-at-20-13-16.jpg" 
                          alt="Aaradhya Pathak" 
                          className="relative w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      </div>
                      <h4 className="font-bold text-lg text-gray-900">Aaradhya Pathak</h4>
                      <div className="text-xs font-bold text-primary bg-blue-50 px-2 py-1 rounded-full mb-3 mt-1">Full Stack Developer</div>
                      <p className="text-[11px] leading-relaxed text-gray-600 text-justify mb-4">
                        Passionate and driven Full Stack Web Developer proficient in the MERN (MongoDB, Express.js, React.js, Node.js) stack and possessing a strong foundation in Data Structures and Algorithms (DSA) using Java. With a Bachelor's degree in Engineering and experience in developing diverse projects, including robust web applications and AI-driven platforms, I bring a keen understanding of web development principles and proven problem-solving abilities.
                      </p>
                      <a href="https://portfolioaaradhya.netlify.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold px-5 py-2 rounded-full hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                        <i className="fa-solid fa-globe"></i> View Portfolio
                      </a>
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2 border-8 border-transparent border-t-white"></div>
                  </div>
                </div>
                <span>,</span>
                <span className="hover:text-white transition-colors">Nimesh Kulkarni</span>
                <span>,</span>
                <span className="hover:text-white transition-colors">Bhavesh Patil</span>
                <span>,</span>
                <span className="hover:text-white transition-colors">Sanika Wadnekar</span>
              </div>
              <div className="text-gray-600 text-xs mt-4">
                &copy; {new Date().getFullYear()} InterviewXpert. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;