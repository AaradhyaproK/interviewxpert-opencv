import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { jsPDF } from 'jspdf';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { Sun, Moon, Menu, X } from 'lucide-react';

const NetworkStatus = () => {
  const [speed, setSpeed] = React.useState<number | null>(null);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    const updateSpeed = () => {
      if (connection && connection.downlink) {
        setSpeed(connection.downlink);
      }
    };

    if (connection) {
      updateSpeed();
      connection.addEventListener('change', updateSpeed);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (connection) {
        connection.removeEventListener('change', updateSpeed);
      }
    };
  }, []);

  if (!isOnline) return null;

  let statusColor = 'text-green-600 bg-green-50 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
  let icon = '🟢';

  if (speed !== null && speed < 2) {
    statusColor = 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    icon = '🔴';
  } else if (speed !== null && speed < 5) {
    statusColor = 'text-yellow-600 bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    icon = '🟡';
  }

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${statusColor} whitespace-nowrap`}>
      <i className="fas fa-wifi"></i>
      <span className="hidden sm:inline">{speed !== null && speed < 2 ? 'Weak' : speed !== null && speed < 5 ? 'Fair' : 'Good'} {icon}</span>
      {speed && <span>{speed} <span className="hidden sm:inline">Mbps</span></span>}
    </div>
  );
};

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const { isDark, toggleTheme } = useTheme();
  if (!user) return <>{children}</>;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent font-sans text-gray-800 dark:text-slate-100 transition-colors duration-300 relative flex flex-col">
      {/* Tech Grid Pattern for Dark Mode */}
      <div className="absolute inset-0 z-[-1] hidden dark:block pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}>
      </div>

      <nav className="bg-white/95 dark:bg-black/90 backdrop-blur-md shadow-sm sticky top-0 z-[100] border-b border-gray-100 dark:border-slate-800 transition-all">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-2 lg:gap-4">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <img src="/logo.png" alt="InterviewXpert Logo" className="w-8 h-8 rounded-lg object-cover dark:invert dark:hue-rotate-180" />
                <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white hidden xl:block">InterviewXpert</span>
              </Link>
              <div className="hidden xl:flex items-center gap-1">
                {userProfile?.role === 'admin' ? (
                  <Link to="/admin" className={`${isActive('/admin') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'} px-2 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap`}>
                    Admin Dashboard
                  </Link>
                ) : userProfile?.role === 'recruiter' ? (
                  <>
                    <Link to="/recruiter/jobs" className={`${isActive('/recruiter/jobs') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'} px-2 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap`}>
                      Dashboard
                    </Link>
                    <Link to="/recruiter/post" className={`${isActive('/recruiter/post') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'} px-2 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap`}>
                      Post Job
                    </Link>
                    <Link to="/recruiter/requests" className={`${isActive('/recruiter/requests') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'} px-2 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap`}>
                      Requests
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/candidate/jobs" className={`${isActive('/candidate/jobs') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'} px-2 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap`}>
                      Available Jobs
                    </Link>
                    <Link to="/candidate/best-matches" className={`${isActive('/candidate/best-matches') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'} px-2 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap`}>
                      Best Matches
                    </Link>
                    <Link to="/candidate/interviews" className={`${isActive('/candidate/interviews') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'} px-2 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap`}>
                      My Interviews
                    </Link>
                    <Link to="/candidate/resume-analysis" className={`${isActive('/candidate/resume-analysis') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'} px-2 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap`}>
                      Resume Analysis
                    </Link>
                    <Link to="/candidate/resume-builder" className={`${isActive('/candidate/resume-builder') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'} px-2 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap`}>
                      Resume Builder
                    </Link>
                    <Link to="/candidate/mock-interview" className={`${isActive('/candidate/mock-interview') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'} px-2 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap`}>
                      Mock Interview
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-yellow-400 transition-colors"
                title="Toggle Theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {userProfile?.role === 'candidate' && (
                <Link to="/candidate/payment" className="hidden md:flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full border border-yellow-200 dark:border-yellow-800 text-xs font-bold hover:bg-yellow-100 transition-colors" title="Wallet Balance">
                  <i className="fas fa-coins"></i>
                  <span>{(userProfile as any)?.walletBalance || 0}</span>
                </Link>
              )}

              <NotificationCenter />

              <div className="hidden md:flex relative group items-center gap-2 border-l border-gray-200 dark:border-slate-700 pl-3 ml-1 h-8">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-slate-200 cursor-pointer">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <div className="flex flex-col items-start justify-center">
                    <span className="leading-none mb-0.5 max-w-[100px] truncate">{userProfile?.fullname || 'Profile'}</span>
                    <NetworkStatus />
                  </div>
                </div>

                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-black/90 backdrop-blur-md rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform group-hover:translate-y-1">
                  <div className="p-4 flex items-center gap-4 border-b border-gray-100 dark:border-slate-800">
                    <img
                      src={userProfile?.profilePhotoURL || `https://ui-avatars.com/api/?name=${userProfile?.fullname?.replace(/\s/g, '+')}&background=random&color=fff`}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                    />
                    <div>
                      <div className="font-bold text-gray-800 dark:text-white">{userProfile?.fullname}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{userProfile?.email}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">{userProfile?.experience || 0} years of experience</div>
                    </div>
                  </div>
                  <div className="p-2">
                    <Link to="/profile" className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 hover:text-primary dark:hover:text-primary">
                      <i className="fas fa-user-circle w-4 text-center"></i> View Full Profile
                    </Link>
                  </div>
                </div>

                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 ml-1" title="Logout">
                  <i className="fa-solid fa-right-from-bracket text-lg"></i>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="flex xl:hidden items-center">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-slate-200 hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-lg animate-in slide-in-from-top-5 duration-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {userProfile?.role === 'admin' ? (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/admin') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>Admin Dashboard</Link>
              ) : userProfile?.role === 'recruiter' ? (
                <>
                  <Link to="/recruiter/jobs" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/recruiter/jobs') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>Dashboard</Link>
                  <Link to="/recruiter/post" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/recruiter/post') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>Post Job</Link>
                  <Link to="/recruiter/requests" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/recruiter/requests') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>Requests</Link>
                </>
              ) : (
                <>
                  <Link to="/candidate/jobs" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/candidate/jobs') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>Available Jobs</Link>
                  <Link to="/candidate/best-matches" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/candidate/best-matches') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>Best Matches</Link>
                  <Link to="/candidate/interviews" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/candidate/interviews') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>My Interviews</Link>
                  <Link to="/candidate/resume-analysis" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/candidate/resume-analysis') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>Resume Analysis</Link>
                  <Link to="/candidate/resume-builder" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/candidate/resume-builder') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>Resume Builder</Link>
                  <Link to="/candidate/mock-interview" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/candidate/mock-interview') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>Mock Interview</Link>
                  <Link to="/candidate/payment" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/candidate/payment') ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                    <div className="flex items-center gap-2">
                      <span>Wallet</span>
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">{(userProfile as any)?.walletBalance || 0} pts</span>
                    </div>
                  </Link>
                </>
              )}
            </div>
            <div className="pt-4 pb-4 border-t border-gray-200 dark:border-slate-800">
              <div className="flex items-center justify-between px-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <img className="h-10 w-10 rounded-full object-cover" src={userProfile?.profilePhotoURL || `https://ui-avatars.com/api/?name=${userProfile?.fullname?.replace(/\s/g, '+')}&background=random&color=fff`} alt="" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium leading-none text-gray-800 dark:text-white">{userProfile?.fullname}</div>
                    <div className="text-sm font-medium leading-none text-gray-500 dark:text-slate-400 mt-1">{userProfile?.email}</div>
                  </div>
                </div>
                <NetworkStatus />
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800">Your Profile</Link>
                <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-slate-800">Sign out</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className={`${location.pathname === '/candidate/resume-builder' ? 'w-full' : 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'} flex-grow`}>
        {children}
      </main>

      <footer className="bg-white/80 dark:bg-black/80 backdrop-blur-sm border-t border-gray-200 dark:border-slate-800 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Developed & Designed by{' '}
            <a href="https://portfolioaaradhya.netlify.app/" target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors">Aaradhya Pathak</a>,{' '}
            <a href="https://nimesh-portfolio-iota.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors">Nimesh Kulkarni</a>,{' '}
            <a href="https://www.linkedin.com/in/bhavesh-patil-ggsf?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors">Bhavesh Patil</a>,{' '}
            <span className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors cursor-default">Sanika Wadnekar</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <LayoutContent>{children}</LayoutContent>
  </ThemeProvider>
);

export default Layout;