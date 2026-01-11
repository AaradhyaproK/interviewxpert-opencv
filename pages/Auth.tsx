import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, addDoc, collection, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [role, setRole] = useState<'recruiter' | 'candidate'>('candidate');
  const [experience, setExperience] = useState(0);
  const [phone, setPhone] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential.user.emailVerified) {
        // Check if admin verified manually in Firestore
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (!userDoc.exists() || !userDoc.data().adminVerified) {
          await signOut(auth);
          setError("Please verify your email address before logging in.");
          return;
        }
      }
      navigate('/');
    } catch (err: any) {
      setError("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    // Handle Recruiter Request (Do not create Auth user yet)
    if (role === 'recruiter') {
      try {
        await addDoc(collection(db, 'recruiterRequests'), {
          email,
          fullname,
          experience: Number(experience),
          status: 'pending',
          createdAt: serverTimestamp()
        });
        setMessage("Request sent! An admin will review your recruiter application. You will be notified once approved.");
      } catch (err: any) {
        setError("Request failed: " + err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      const userData: any = {
        uid: cred.user.uid,
        email,
        fullname,
        role,
        experience: Number(experience),
        accountStatus: 'active',
        createdAt: serverTimestamp(),
        profilePhotoURL: null
      };

      if (role === 'candidate') {
        userData.phone = phone;
      }

      await setDoc(doc(db, 'users', cred.user.uid), userData);
      
      await sendEmailVerification(cred.user);
      await signOut(auth);

      setMessage("Account created! Please check your email for a verification link before logging in.");
      navigate('/profile'); // Redirect to profile for completion
    } catch (err: any) {
      setError("Signup failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
      setIsReset(false);
      setIsLogin(true);
    } catch (err: any) {
      setError("Reset failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Professional Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3"></div>
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gray-200 dark:bg-slate-800/10 rounded-full blur-3xl opacity-60 translate-y-1/3 -translate-x-1/4"></div>
      </div>

      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-5xl flex rounded-3xl shadow-2xl overflow-hidden bg-white/80 dark:bg-black/80 backdrop-blur-lg border border-white/20 dark:border-slate-700/50 min-h-[600px] transition-colors duration-300">
        
        {/* Left Side - Creative Banner (Hidden on mobile) */}
        <div className="hidden md:flex w-5/12 bg-gradient-to-br from-gray-800 to-blue-900 p-12 flex-col justify-between text-white relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="relative z-10">
             <img src="https://i.ibb.co/3y9DKsB6/Yellow-and-Black-Illustrative-Education-Logo-1.png" alt="InterviewXpert Logo" className="w-16 h-16 rounded-xl mb-8" />
             <h2 className="text-4xl font-bold mb-6 leading-tight">Master Your <br/>Next Interview</h2>
             <p className="text-blue-100 text-lg leading-relaxed">Join thousands of candidates using AI to land their dream jobs at top tech companies.</p>
           </div>
           
           <div className="space-y-5 relative z-10">
             <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10 transform transition hover:scale-105 cursor-default">
               <div className="w-10 h-10 rounded-full bg-green-400/20 flex items-center justify-center text-green-300"><i className="fa-solid fa-check"></i></div>
               <span className="font-medium">Real-time AI Feedback</span>
             </div>
             <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10 transform transition hover:scale-105 cursor-default delay-75">
               <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-300"><i className="fa-solid fa-bolt"></i></div>
               <span className="font-medium">Instant Performance Score</span>
             </div>
           </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-white/50 dark:bg-transparent">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isReset ? 'Reset Password' : isLogin ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mb-8">
              {isReset ? 'Enter your email to receive a reset link' : isLogin ? 'Please enter your details to sign in.' : 'Start your journey with InterviewXpert today.'}
            </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-xl border border-red-100 dark:border-red-800 flex items-center gap-3 animate-pulse">
          <i className="fa-solid fa-circle-exclamation"></i>
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-xl border border-green-100 dark:border-green-800 flex items-center gap-3">
          <i className="fa-solid fa-check-circle"></i>
          {message}
        </div>
      )}

      {isReset ? (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white/50 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-500"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl shadow-lg shadow-primary/30 text-white bg-gradient-to-r from-primary to-primary-dark hover:to-primary font-semibold transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <div className="text-center mt-4">
            <button 
              type="button"
              onClick={() => setIsReset(false)}
              className="text-sm text-gray-500 hover:text-primary transition-colors font-medium"
            >
              <i className="fa-solid fa-arrow-left mr-1"></i> Back to Login
            </button>
          </div>
        </form>
      ) : (
      <>
      <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
        {/* Signup Only Fields */}
        {!isLogin && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full Name</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white/50 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-500"
                placeholder="John Doe"
                value={fullname}
                onChange={e => setFullname(e.target.value)}
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">I am a...</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white/50 dark:bg-slate-800/50 dark:text-white"
                value={role}
                onChange={e => setRole(e.target.value as 'candidate' | 'recruiter')}
              >
                <option value="candidate">Candidate</option>
                {/* Normally hide recruiter signup or make it restricted, but kept open per original app */}
                <option value="recruiter">Recruiter (Hiring Manager)</option> 
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Years of Experience</label>
              <input 
                type="number" 
                min="0"
                required 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white/50 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-500"
                value={experience}
                onChange={e => setExperience(Number(e.target.value))}
              />
            </div>
            {role === 'candidate' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  pattern="[0-9]{10}"
                  required 
                  placeholder="10 digit number"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white/50 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-500"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            )}
          </>
        )}

        {/* Common Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email Address</label>
          <input 
            type="email" 
            required 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white/50 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-500"
            placeholder="you@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Password</label>
          <input 
            type="password" 
            required 
            minLength={6}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white/50 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-500"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {isLogin && (
          <div className="flex justify-end">
            <button type="button" onClick={() => setIsReset(true)} className="text-sm text-primary hover:text-primary-dark font-medium transition-colors">
              Forgot Password?
            </button>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg shadow-primary/30 text-white bg-gradient-to-r from-primary to-primary-dark hover:to-primary font-bold text-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-circle-notch fa-spin"></i>
              Processing...
            </span>
          ) : (
             isLogin ? 'Sign In' : (role === 'recruiter' ? 'Submit Request' : 'Create Account')
          )}
        </button>
      </form>

      <div className="mt-8 text-center space-y-4">
        <div className="flex items-center gap-4 my-6">
          <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div>
          <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">or</span>
          <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div>
        </div>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="text-gray-600 dark:text-slate-400 hover:text-primary font-medium transition-colors"
        >
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span className="text-primary font-bold hover:underline">{isLogin ? "Sign Up" : "Log In"}</span>
        </button>

        <div>
          <Link to="/" className="text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center gap-2">
            <i className="fa-solid fa-house"></i> Back to Home
          </Link>
        </div>
      </div>
      </>
      )}
    </div>
    </div>
    </div>
    </div>

    <footer className="relative z-10 bg-white/50 dark:bg-black/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-slate-800/50 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Developed & Designed by{' '}
            <span className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors cursor-default">Aaradhya Pathak</span>,{' '}
            <span className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors cursor-default">Nimesh Kulkarni</span>,{' '}
            <span className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors cursor-default">Bhavesh Patil</span>,{' '}
            <span className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors cursor-default">Sanika Wadnekar</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AuthPage;