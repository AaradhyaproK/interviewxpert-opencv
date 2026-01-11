import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { Sun, Moon, Menu, X, Monitor } from 'lucide-react';

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

  let statusColor = 'text-green-500 bg-green-500/10 border-green-500/20';
  let icon = '🟢';

  if (speed !== null && speed < 2) {
    statusColor = 'text-red-500 bg-red-500/10 border-red-500/20';
    icon = '🔴';
  } else if (speed !== null && speed < 5) {
    statusColor = 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
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

  const { theme, setTheme } = useTheme();

  // Force Dark Mode for this theme update if desired, but respecting user toggle for now.
  // Ideally for "Black Dignity" we default to dark or design the light mode to be very minimal too.

  if (!user) return <>{children}</>;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-200 font-sans selection:bg-primary/30 selection:text-primary-foreground flex flex-col transition-colors duration-300">
      {/* Background Subtle Gradient - Dark Mode Only */}
      <div className="fixed inset-0 z-[-1] bg-gradient-to-tr from-[#000000] via-[#050505] to-[#0a0a0a] pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-300" />

      {/* Tech Grid Pattern - subtle texture */}
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}>
      </div>

      <nav className="bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 sticky top-0 z-[100] transition-all duration-300">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Logo Area */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 flex items-center justify-center transition-all duration-300">
                  <img src="/gold_logo.png" alt="Logo" className="w-10 h-10 object-contain dark:invert" />
                </div>
                <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white hidden xl:block group-hover:text-primary transition-colors">
                  Interview<span className="text-orange-500 font-light">Xpert</span>
                </span>
              </Link>
            </div>

            {/* Centered Navigation */}
            <div className="hidden xl:flex items-center justify-center flex-1 px-8">
              <div className="flex items-center bg-gray-100/50 dark:bg-white/5 rounded-full px-2 py-1.5 border border-gray-200 dark:border-white/5 backdrop-blur-sm">
                {userProfile?.role === 'admin' ? (
                  <Link to="/admin" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/admin') ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'}`}>
                    Admin Dashboard
                  </Link>
                ) : userProfile?.role === 'recruiter' ? (
                  <>
                    <Link to="/recruiter/jobs" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/recruiter/jobs') ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'}`}>
                      Dashboard
                    </Link>
                    <Link to="/recruiter/post" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/recruiter/post') ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'}`}>
                      Post Job
                    </Link>
                    <Link to="/recruiter/candidates" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/recruiter/candidates') ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'}`}>
                      Manage Candidates
                    </Link>
                    <Link to="/recruiter/requests" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/recruiter/requests') ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'}`}>
                      Requests
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/candidate/jobs" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/candidate/jobs') ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'}`}>
                      Jobs
                    </Link>
                    <Link to="/candidate/best-matches" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/candidate/best-matches') ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'}`}>
                      Best Matches
                    </Link>
                    <Link to="/candidate/interviews" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/candidate/interviews') ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'}`}>
                      My Interviews
                    </Link>
                    <Link to="/candidate/resume-analysis" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/candidate/resume-analysis') ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'}`}>
                      Resume AI
                    </Link>
                    <Link to="/candidate/resume-builder" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/candidate/resume-builder') ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'}`}>
                      Builder
                    </Link>
                    <Link to="/candidate/mock-interview" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/candidate/mock-interview') ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'}`}>
                      Mock
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Wallet for Candidate */}
              {userProfile?.role === 'candidate' && (
                <Link to="/candidate/payment" className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-400 rounded-full border border-yellow-500/20 text-xs font-bold hover:bg-yellow-500/20 transition-all" title="Wallet Balance">
                  <i className="fas fa-coins"></i>
                  <span>{(userProfile as any)?.walletBalance || 0}</span>
                </Link>
              )}

              <NotificationCenter />

              {/* Profile Dropdown */}
              <div className="hidden md:flex relative group items-center gap-3 pl-3 ml-1 h-9 border-l border-white/10">
                <div className="flex items-center gap-3 cursor-pointer">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-semibold text-gray-700 dark:text-white leading-none">{userProfile?.fullname || 'User'}</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">{userProfile?.role || 'Guest'}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/20 p-0.5 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                    <img
                      src={userProfile?.profilePhotoURL || `https://ui-avatars.com/api/?name=${userProfile?.fullname?.replace(/\s/g, '+') || 'User'}&background=random&color=fff`}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>

                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-4 w-72 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform group-hover:translate-y-0 translate-y-2">
                  <div className="p-5 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 rounded-t-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full p-0.5 border border-gray-200 dark:border-white/10">
                        <img
                          src={userProfile?.profilePhotoURL || `https://ui-avatars.com/api/?name=${userProfile?.fullname?.replace(/\s/g, '+')}&background=random&color=fff`}
                          alt="Avatar"
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-base">{userProfile?.fullname}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[140px]">{userProfile?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <Link to="/profile" className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-white transition-colors">
                      <i className="fas fa-user-circle w-5 text-center text-gray-500"></i> View Profile
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm text-red-500 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 transition-colors">
                      <i className="fa-solid fa-right-from-bracket w-5 text-center"></i> Sign Out
                    </button>
                  </div>
                  <div className="p-3 border-t border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-black/20 rounded-b-xl">
                    <div className="flex items-center gap-1 bg-gray-200/50 dark:bg-white/5 rounded-lg p-1 border border-gray-200 dark:border-white/5">
                      <button
                        onClick={() => setTheme('light')}
                        className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        title="Light"
                      >
                        <Sun size={14} />
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        title="Dark"
                      >
                        <Moon size={14} />
                      </button>
                      <button
                        onClick={() => setTheme('system')}
                        className={`p-1.5 rounded-md transition-all ${theme === 'system' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30' : 'text-gray-500 hover:text-gray-300'}`}
                        title="System"
                      >
                        <Monitor size={14} />
                      </button>
                    </div>
                    <NetworkStatus />
                  </div>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="flex xl:hidden items-center">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5 focus:outline-none transition-colors"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-[#0a0a0a] border-t border-white/5 shadow-2xl animate-in slide-in-from-top-5 duration-200 absolute w-full left-0 z-50">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {userProfile?.role === 'admin' ? (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-medium ${isActive('/admin') ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>Admin Dashboard</Link>
              ) : userProfile?.role === 'recruiter' ? (
                <>
                  <Link to="/recruiter/jobs" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-medium ${isActive('/recruiter/jobs') ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>Dashboard</Link>
                  <Link to="/recruiter/post" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-medium ${isActive('/recruiter/post') ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>Post Job</Link>
                  <Link to="/recruiter/candidates" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-medium ${isActive('/recruiter/candidates') ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>Manage Candidates</Link>
                  <Link to="/recruiter/requests" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-medium ${isActive('/recruiter/requests') ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>Requests</Link>
                </>
              ) : (
                <>
                  <Link to="/candidate/jobs" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-medium ${isActive('/candidate/jobs') ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>Available Jobs</Link>
                  <Link to="/candidate/interviews" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-medium ${isActive('/candidate/interviews') ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>My Interviews</Link>
                  {/* Add other mobile links as needed */}
                </>
              )}
            </div>
            <div className="pt-4 pb-6 border-t border-white/5 px-4">
              <div className="flex items-center gap-3 mb-4">
                <img className="h-10 w-10 rounded-full object-cover border border-white/10" src={userProfile?.profilePhotoURL || `https://ui-avatars.com/api/?name=${userProfile?.fullname?.replace(/\s/g, '+')}&background=random&color=fff`} alt="" />
                <div>
                  <div className="text-base font-medium leading-none text-white">{userProfile?.fullname}</div>
                  <div className="text-sm font-medium leading-none text-gray-500 mt-1">{userProfile?.email}</div>
                </div>
              </div>
              <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="block w-full text-center px-4 py-3 rounded-xl text-base font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>

      <footer className="border-t border-gray-200 dark:border-white/5 bg-white/50 dark:bg-[#050505]/50 backdrop-blur-sm py-8 mt-auto z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <img src="/gold_logo.png" alt="Logo" className="w-6 h-6 object-contain dark:invert" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">InterviewXpert</span>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Support Center</a>
            </div>

            <div className="text-xs text-gray-400 dark:text-gray-600 font-medium">
              &copy; {new Date().getFullYear()} InterviewXpert Inc.
            </div>
          </div>
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