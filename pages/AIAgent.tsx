import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useAuth } from '../context/AuthContext';
import {
    Bot,
    Send,
    User,
    Plus,
    MessageSquare,
    PanelLeftClose,
    PanelLeftOpen,
    Trash2,
    MoreHorizontal,
    Edit3
} from 'lucide-react';

// --- Types ---
interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

interface ChatSession {
    id: string;
    title: string;
    createdAt: number;
    messages: Message[];
}

const AIAgent: React.FC = () => {
    const { user, userProfile } = useAuth();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
    const [isHoveringSession, setHoveringSession] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    // --- Persistence & Initialization ---

    useEffect(() => {
        // Load sessions from local storage on mount
        const saved = localStorage.getItem('ai_chat_sessions');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSessions(parsed);
                if (parsed.length > 0) {
                    setCurrentSessionId(parsed[0].id);
                } else {
                    createNewSession();
                }
            } catch (e) {
                console.error("Failed to parse chat sessions", e);
                createNewSession();
            }
        } else {
            createNewSession();
        }
    }, []);

    useEffect(() => {
        // Save sessions whenever they change
        if (sessions.length > 0) {
            localStorage.setItem('ai_chat_sessions', JSON.stringify(sessions));
        }
    }, [sessions]);

    useEffect(() => {
        scrollToBottom();
    }, [currentSessionId, sessions, loading]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // --- Actions ---

    const createNewSession = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            createdAt: Date.now(),
            messages: []
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        if (window.innerWidth < 768) setSidebarOpen(false); // Auto close sidebar on mobile
    };

    const deleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newSessions = sessions.filter(s => s.id !== id);
        setSessions(newSessions);
        if (currentSessionId === id) {
            if (newSessions.length > 0) {
                setCurrentSessionId(newSessions[0].id);
            } else {
                createNewSession();
            }
        }
        if (newSessions.length === 0) localStorage.removeItem('ai_chat_sessions');
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !currentSessionId) return;

        const sessionIndex = sessions.findIndex(s => s.id === currentSessionId);
        if (sessionIndex === -1) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input.trim(),
            timestamp: Date.now()
        };

        const updatedSessions = [...sessions];
        updatedSessions[sessionIndex].messages.push(userMsg);

        // Auto-title the session if it's the first message
        if (updatedSessions[sessionIndex].messages.length === 1) {
            const title = userMsg.text.slice(0, 30) + (userMsg.text.length > 30 ? '...' : '');
            updatedSessions[sessionIndex].title = title;
        }

        setSessions(updatedSessions);
        setInput('');
        setLoading(true);

        try {
            // Prepare context
            const history = updatedSessions[sessionIndex].messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            // Remove the last user message we just added from history array passed to API 
            // (SDK handles conversation history differently, but for manual construction we pass pure history + last msg)
            // But here we'll just pass the full history to the model directly if using sendMessage on a chat session object
            // For simplicity with generateContent, we pass the full list.

            const systemInstruction = `You are a helpful, professional AI interview coach and career assistant named "Career Copilot". 
            User Context: The user's name is ${userProfile?.fullname || 'Candidate'}.
            
            Response Guidelines:
            - Provide detailed, thorough, and descriptive answers (medium to long length)
            - Structure your responses with clear sections using Markdown formatting (headers, bullet points, numbered lists)
            - Include practical examples, actionable tips, and specific recommendations
            - Be encouraging and supportive while providing constructive feedback
            - When applicable, break down complex topics into digestible parts
            - Use bold text for key points and important takeaways
            - Aim for responses that are comprehensive yet easy to read
            - For interview questions, provide sample answers with explanations
            - For career advice, include both immediate steps and long-term strategies
            
            Remember: Quality and depth of information is more valuable than brevity. Help the user truly understand and succeed.`;

            const response = await genAI.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    { role: "user", parts: [{ text: systemInstruction }] },
                    ...history
                ]
            });

            const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: text,
                timestamp: Date.now()
            };

            const finalSessions = [...sessions];
            const finalIndex = finalSessions.findIndex(s => s.id === currentSessionId); // Re-find in case index shifted (unlikely)
            if (finalIndex !== -1) {
                finalSessions[finalIndex].messages.push(aiMsg);
                setSessions(finalSessions);
            }

        } catch (error) {
            console.error("Generation error", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "Sorry, I encountered an error. Please try again.",
                timestamp: Date.now()
            };
            const errSessions = [...sessions];
            const errIndex = errSessions.findIndex(s => s.id === currentSessionId);
            if (errIndex !== -1) {
                errSessions[errIndex].messages.push(errorMsg);
                setSessions(errSessions);
            }
        } finally {
            setLoading(false);
        }
    };

    const currentSession = sessions.find(s => s.id === currentSessionId);

    // --- Render Helpers ---

    const renderMessage = (msg: Message) => (
        <div key={msg.id} className={`flex gap-4 mb-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={16} className="text-white" />
                </div>
            )}

            <div className={`max-w-[85%] md:max-w-[75%] px-5 py-3.5 rounded-2xl text-[15px] leading-7 ${msg.role === 'user'
                ? 'bg-[#2f2f2f] text-white rounded-tr-sm'
                : 'text-gray-900 dark:text-gray-100 dark:bg-transparent pl-0'
                }`}>
                {msg.text.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0 min-h-[1em]">{line}</p>
                ))}
            </div>

            {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
                    <User size={16} className="text-gray-500 dark:text-gray-300" />
                </div>
            )}
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-[#09090b] text-gray-900 dark:text-gray-100 overflow-hidden font-sans">

            {/* --- SIDEBAR --- */}
            {/* --- SIDEBAR BACKDROP (Mobile) --- */}
            {isSidebarOpen && (
                <div
                    className="md:hidden absolute inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* --- SIDEBAR --- */}
            <div className={`
                fixed md:relative z-50 h-full
                bg-gray-50 dark:bg-[#000000] 
                transition-all duration-300 ease-in-out 
                border-r border-gray-200 dark:border-white/5 
                flex flex-col shadow-xl md:shadow-none
                w-[280px]
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden'}
            `}>
                <div className="p-3">
                    <button
                        onClick={createNewSession}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium"
                    >
                        <Plus size={18} /> New chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    <div className="text-xs font-semibold text-gray-400 px-3 py-2 mt-2">Recent</div>
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            className={`group relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm cursor-pointer mb-1 transition-colors ${currentSessionId === session.id
                                ? 'bg-gray-200 dark:bg-[#1a1a1a]'
                                : 'hover:bg-gray-100 dark:hover:bg-[#111]'
                                }`}
                            onClick={() => {
                                setCurrentSessionId(session.id);
                                if (window.innerWidth < 768) setSidebarOpen(false);
                            }}
                            onMouseEnter={() => setHoveringSession(session.id)}
                            onMouseLeave={() => setHoveringSession(null)}
                        >
                            <MessageSquare size={16} className="text-gray-500 shrink-0" />
                            <span className="truncate flex-1 max-w-[170px]">{session.title}</span>

                            {(isHoveringSession === session.id || currentSessionId === session.id) && (
                                <button
                                    className="absolute right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-gray-300 dark:hover:bg-[#2a2a2a] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => deleteSession(e, session.id)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Sidebar Footer */}

            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col relative h-full">

                {/* Navbar (Mobile/Toggle) */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-2 md:p-3 text-gray-500 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg transition-colors"
                        >
                            {isSidebarOpen ? <PanelLeftClose size={24} /> : <PanelLeftOpen size={24} />}
                        </button>
                        <span className="md:hidden font-semibold text-gray-900 dark:text-white">Career Copilot</span>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    {!currentSession || currentSession.messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center pt-[12vh] px-4">
                            <div className="w-16 h-16 bg-white dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6 shadow-sm">
                                <Bot size={32} className="text-gray-900 dark:text-gray-100" />
                            </div>
                            <h2 className="text-2xl font-semibold mb-2 text-center text-gray-900 dark:text-white">
                                How can I help you today?
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
                                I can analyze your resume, help you prepare for specific roles, or conduct mock interviews.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                                {['Analyze my weak points', 'Mock interview for Product Manager', 'Optimize my resume', 'Salary negotiation tips'].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => { setInput(suggestion); }}
                                        className="p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] text-left text-sm text-gray-600 dark:text-gray-300 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
                            {currentSession.messages.map(msg => renderMessage(msg))}
                            {loading && (
                                <div className="flex gap-4 mb-6">
                                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 mt-1">
                                        <Bot size={16} className="text-white" />
                                    </div>
                                    <div className="flex items-center gap-1.5 h-8">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} className="h-4" />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 bg-white dark:bg-[#09090b]">
                    <div className="max-w-3xl mx-auto relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Message Career Copilot..."
                            className="w-full bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white rounded-full py-3.5 pl-5 pr-12 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 placeholder-gray-500"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="text-center text-[11px] text-gray-400 mt-2">
                        AI can make mistakes. Check important info.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default AIAgent;
