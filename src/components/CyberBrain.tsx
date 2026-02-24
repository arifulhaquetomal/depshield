import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { askSecurityBrain } from '@/services/ai';
import { cn } from '@/utils/cn';

interface CyberBrainProps {
    contextData?: string;
    isOpen?: boolean;
    onToggle?: () => void;
    initialQuestion?: string;
}

interface Message {
    role: 'user' | 'ai';
    text: string;
}

export function CyberBrain({ contextData, isOpen: controlledIsOpen, onToggle, initialQuestion }: CyberBrainProps) {
    const [isOpenState, setIsOpenState] = useState(false);
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : isOpenState;
    const handleToggle = onToggle || (() => setIsOpenState(!isOpen));

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', text: 'Hello! I am your DepShield Security Consultant. I can help analyze your scan results or explain security concepts. What would you like to know?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Handle initial question triggering
    useEffect(() => {
        if (initialQuestion && isOpen) {
            handleSend(initialQuestion);
        }
    }, [initialQuestion]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const newMsg: Message = { role: 'user', text };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setIsLoading(true);

        const response = await askSecurityBrain(text, contextData);

        setMessages(prev => [...prev, { role: 'ai', text: response }]);
        setIsLoading(false);
    };

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={handleToggle}
                    className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:scale-110 transition-transform z-50 group"
                >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border border-black" />
                </button>
            )}

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-100">DepShield Brain</h3>
                                    <div className="flex items-center gap-1 text-xs text-cyan-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                        <span>Gemini-2.5-Flash Active</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleToggle} className="p-1 hover:bg-slate-800 rounded">
                                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "max-w-[80%] rounded-xl p-3 text-sm",
                                        msg.role === 'user'
                                            ? "ml-auto bg-cyan-600/20 text-cyan-50 border border-cyan-500/30 rounded-br-none"
                                            : "mr-auto bg-slate-800 text-slate-200 border border-slate-700/50 rounded-bl-none"
                                    )}
                                >
                                    {msg.text}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="mr-auto bg-slate-800 rounded-xl p-3 rounded-bl-none flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about vulnerabilities..."
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="p-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
