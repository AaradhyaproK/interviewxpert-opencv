import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { jsPDF } from 'jspdf';

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

  let statusColor = 'text-green-600 bg-green-50 border-green-100';
  let icon = '🟢';
  
  if (speed !== null && speed < 2) {
    statusColor = 'text-red-600 bg-red-50 border-red-100';
    icon = '🔴';
  } else if (speed !== null && speed < 5) {
    statusColor = 'text-yellow-600 bg-yellow-50 border-yellow-100';
    icon = '🟡';
  }

  return (
    <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
      <i className="fas fa-wifi"></i>
      <span>{speed !== null && speed < 2 ? 'Weak' : speed !== null && speed < 5 ? 'Fair' : 'Good'} {icon}</span>
      {speed && <span>{speed} Mbps</span>}
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (!user) return <>{children}</>;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 transition-all">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4 lg:gap-8">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <img src="https://i.ibb.co/3y9DKsB6/Yellow-and-Black-Illustrative-Education-Logo-1.png" alt="InterviewXpert Logo" className="w-14 h-14 rounded-xl object-cover" />
                <span className="font-bold text-xl tracking-tight text-gray-900">InterviewXpert</span>
              </Link>
              <div className="hidden md:flex items-center space-x-1">
                {userProfile?.role === 'recruiter' ? (
                  <>
                    <Link to="/recruiter/jobs" className={`${isActive('/recruiter/jobs') ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap`}>
                      Dashboard
                    </Link>
                    <Link to="/recruiter/post" className={`${isActive('/recruiter/post') ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap`}>
                      Post Job
                    </Link>
                    <Link to="/recruiter/requests" className={`${isActive('/recruiter/requests') ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap`}>
                      Requests
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/candidate/jobs" className={`${isActive('/candidate/jobs') ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap`}>
                      Available Jobs
                    </Link>
                    <Link to="/candidate/best-matches" className={`${isActive('/candidate/best-matches') ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap`}>
                      Best Matches
                    </Link>
                    <Link to="/candidate/interviews" className={`${isActive('/candidate/interviews') ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap`}>
                      My Interviews
                    </Link>
                    <Link to="/candidate/resume-analysis" className={`${isActive('/candidate/resume-analysis') ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap`}>
                      Resume Analysis
                    </Link>
                    <Link to="/candidate/resume-builder" className={`${isActive('/candidate/resume-builder') ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap`}>
                      Resume Builder
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NetworkStatus />
              <NotificationCenter />
              
              <div className="relative group flex items-center gap-3 border-l border-gray-200 pl-4 ml-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors">
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <span className="hidden md:block">{userProfile?.fullname || 'Profile'}</span>
                </div>

                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform group-hover:translate-y-1">
                  <div className="p-4 flex items-center gap-4 border-b border-gray-100">
                    <img 
                      src={userProfile?.profilePhotoURL || `https://ui-avatars.com/api/?name=${userProfile?.fullname?.replace(/\s/g, '+')}&background=random&color=fff`} 
                      alt="Avatar" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                    />
                    <div>
                      <div className="font-bold text-gray-800">{userProfile?.fullname}</div>
                      <div className="text-xs text-gray-500 truncate">{userProfile?.email}</div>
                      <div className="text-xs text-gray-500">{userProfile?.experience || 0} years of experience</div>
                    </div>
                  </div>
                  <div className="p-2">
                    <Link to="/profile" className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-primary">
                      <i className="fas fa-user-circle w-4 text-center"></i> View Full Profile
                    </Link>
                  </div>
                </div>

                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-2" title="Logout">
                  <i className="fa-solid fa-right-from-bracket text-lg"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className={location.pathname === '/candidate/resume-builder' ? 'w-full' : 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'}>
        {children}
      </main>
    </div>
  );
};

export default Layout;