import React, { useState, useRef, useEffect } from 'react';
import { Cpu, X, Send, Zap, ChevronDown, ChevronUp, Minimize2, Maximize2 } from 'lucide-react';
import axios from 'axios';

const QUICK_QUESTIONS = [
  "Show critical incidents",
  "Nearest ambulance with ICU?",
  "Which hospital has ICU beds?",
  "Flood-prone zones?",
  "Daily operations summary",
  "Current weather risk?",
];

export default function AICopilot({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([
    {
      role: 'ai',
      text: "LifeGrid AI Copilot online. I have full situational awareness of all active incidents, resources, weather, and health metrics. Ask me anything."
    }
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Copilot is enabled for all users (Citizens & Emergency Team)
  // if (!currentUser) return null;

  const handleAsk = async (q = null) => {
    const text = q || question.trim();
    if (!text) return;
    setQuestion('');
    setConversation(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await axios.post('/api/copilot/ask', { question: text });
      setConversation(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch {
      setConversation(prev => [...prev, { role: 'ai', text: "Copilot offline — backend connection error. Check system status." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-extrabold text-xs shadow-2xl shadow-indigo-600/40 border border-indigo-400/40 hover:from-indigo-500 hover:to-cyan-500 transition-all cursor-pointer"
          style={{ animation: 'copilot-pulse 3s ease-in-out infinite' }}
        >
          <Cpu className="w-4 h-4 text-cyan-300 group-hover:animate-spin" />
          <span>AI Copilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      )}

      {/* Copilot Panel */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-96 rounded-3xl border border-indigo-500/40 bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-indigo-900/50 flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[520px]'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-950/80 to-cyan-950/80 border-b border-indigo-800/40 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                <Cpu className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-white block">LifeGrid AI Copilot</span>
                <span className="text-[10px] text-indigo-300 font-mono">EOC Situational Intelligence</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1"></span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(m => !m)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors">
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Quick questions */}
              <div className="px-4 py-2.5 border-b border-slate-800/60 shrink-0">
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {QUICK_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleAsk(q)}
                      className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-900/60 text-[10px] text-slate-300 hover:text-indigo-200 border border-slate-700 hover:border-indigo-600/50 cursor-pointer transition-all font-semibold"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversation */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {conversation.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'ai' && (
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                        <Cpu className="w-3 h-3 text-indigo-300" />
                      </div>
                    )}
                    <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600/80 text-white rounded-tr-sm'
                        : 'bg-slate-800/80 text-slate-100 border border-slate-700/60 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                      <Cpu className="w-3 h-3 text-indigo-300 animate-spin" />
                    </div>
                    <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-slate-800/80 border border-slate-700/60">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-slate-800/60 shrink-0">
                <div className="flex items-center gap-2 bg-slate-900 rounded-2xl border border-slate-700/60 px-3 py-2">
                  <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <input
                    className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 outline-none"
                    placeholder="Ask about incidents, resources, risks..."
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAsk()}
                  />
                  <button
                    onClick={() => handleAsk()}
                    disabled={loading || !question.trim()}
                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes copilot-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
          50% { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
        }
      `}</style>
    </>
  );
}
