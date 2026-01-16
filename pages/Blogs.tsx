import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, ArrowLeft, BookOpen, PenLine, Sparkles } from 'lucide-react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

const BlogsContent: React.FC = () => {
    const { toggleTheme, isDark } = useTheme();

    return (
        <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'}`}>
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-3xl ${isDark ? 'bg-purple-600/10' : 'bg-purple-200/30'} animate-pulse`}></div>
                <div className={`absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-3xl ${isDark ? 'bg-blue-600/10' : 'bg-blue-200/30'} animate-pulse animation-delay-2000`}></div>
            </div>

            {/* Navigation Bar */}
            <nav className="relative z-50 flex items-center justify-between px-6 py-4 md:px-12">
                <Link
                    to="/"
                    className={`flex items-center gap-2 font-display font-bold text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} hover:opacity-80 transition-opacity`}
                >
                    <img src="/logo.png" alt="InterviewXpert Logo" className="w-8 h-8 rounded-lg object-cover dark:invert dark:hue-rotate-180" />
                    <span>InterviewXpert</span>
                </Link>

                <div className="flex items-center gap-4">
                    <Link
                        to="/"
                        className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full transition-colors ${isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                    >
                        <ArrowLeft size={16} />
                        Back
                    </Link>
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-full transition-all duration-300 ${isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                        aria-label="Toggle theme"
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="text-center max-w-2xl mx-auto"
                >
                    {/* Animated Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className={`mx-auto w-24 h-24 md:w-32 md:h-32 rounded-3xl flex items-center justify-center mb-8 ${isDark ? 'bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-700/50' : 'bg-gradient-to-br from-purple-100 to-blue-100 border border-purple-200'} shadow-2xl`}
                    >
                        <BookOpen className={`w-12 h-12 md:w-16 md:h-16 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className={`text-4xl md:text-6xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                        Blogs{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600">
                            Coming Soon
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className={`text-lg md:text-xl mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                    >
                        We're crafting insightful articles on career growth, interview tips, resume strategies, and industry trends.
                    </motion.p>

                    {/* Feature Pills */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="flex flex-wrap justify-center gap-3 mb-10"
                    >
                        <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-white text-slate-700 border border-slate-200 shadow-sm'}`}>
                            <PenLine size={14} className="text-purple-500" />
                            Expert Articles
                        </span>
                        <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-white text-slate-700 border border-slate-200 shadow-sm'}`}>
                            <Sparkles size={14} className="text-blue-500" />
                            Career Tips
                        </span>
                        <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-white text-slate-700 border border-slate-200 shadow-sm'}`}>
                            <BookOpen size={14} className="text-green-500" />
                            Industry Insights
                        </span>
                    </motion.div>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                    >
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-1"
                        >
                            <ArrowLeft size={20} />
                            Back to Home
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Animated decorative elements */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0.3 }}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                            className={`w-2 h-2 rounded-full ${isDark ? 'bg-purple-500' : 'bg-purple-400'}`}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
};

const Blogs: React.FC = () => {
    return (
        <ThemeProvider>
            <BlogsContent />
        </ThemeProvider>
    );
};

export default Blogs;
