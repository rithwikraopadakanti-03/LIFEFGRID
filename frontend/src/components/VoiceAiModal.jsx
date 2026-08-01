import React, { useState, useEffect } from 'react';
import { PhoneCall, Mic, MicOff, Volume2, X, Send, AlertTriangle, ShieldCheck, CheckCircle, Languages, UserCheck } from 'lucide-react';
import axios from 'axios';

export default function VoiceAiModal({ isOpen, onClose, targetIncident = null }) {
  const [language, setLanguage] = useState('en'); // en, hi, te, ta, kn
  const [isCalling, setIsCalling] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Start call automatically
      setIsCalling(true);
      const initialGreeting = language === 'hi' 
        ? "नमस्ते, मैं लाइफग्रिड एआई बोल रहा हूँ। आप सुरक्षित स्थान पर रहें। क्या आप किसी आपात स्थिति में हैं?"
        : language === 'te'
        ? "నమస్తే, నేను లైఫ్‌గ్రిడ్ AI మాట్లాడుతున్నాను. సురక్షిత ప్రాంతంలో ఉండండి. ఏమైనా అత్యవసర సహాయం కావాలా?"
        : "Hello, this is LifeGrid AI Autonomous Voice Assistant. Please stay calm. Emergency teams have your location. Are you injured or trapped?";

      setChatLog([{ sender: 'ai', text: initialGreeting }]);
      speakText(initialGreeting, language);
    } else {
      setIsCalling(false);
      setChatLog([]);
    }
  }, [isOpen, language]);

  const speakText = (text, langCode) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      
      const langMap = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'te': 'te-IN',
        'ta': 'ta-IN',
        'kn': 'kn-IN'
      };
      utterance.lang = langMap[langCode] || 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendSpeech = async (customSpeech = null) => {
    const textToSend = customSpeech || speechText;
    if (!textToSend.trim()) return;

    // Add user message
    const newLog = [...chatLog, { sender: 'user', text: textToSend }];
    setChatLog(newLog);
    setSpeechText('');
    setLoading(true);

    try {
      const res = await axios.post('/api/voice/process-speech', {
        phone: "+91 8121985059",
        language: language,
        user_speech: textToSend,
        incident_context: targetIncident
      });

      const aiResponse = res.data.ai_speech_text;
      setChatLog(prev => [...prev, { sender: 'ai', text: aiResponse }]);
      setExtractedData(res.data);
      speakText(aiResponse, language);

      if (window.refreshLifeGridData) {
        window.refreshLifeGridData();
      }
    } catch (e) {
      console.error("Voice AI error", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-panel rounded-3xl border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">OmniDimension Voice AI Engine</h3>
              <p className="text-xs text-slate-400">Autonomous Low-Latency Conversational Emergency Agent</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="en" className="bg-slate-900">English</option>
                <option value="hi" className="bg-slate-900">हिंदी (Hindi)</option>
                <option value="te" className="bg-slate-900">తెలుగు (Telugu)</option>
                <option value="ta" className="bg-slate-900">தமிழ் (Tamil)</option>
                <option value="kn" className="bg-slate-900">ಕನ್ನಡ (Kannada)</option>
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audio Waveform Animation Banner */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/60 p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-200">Call Connected: Citizen (+91 98765 43210)</span>
          </div>

          {/* Audio Waveform Bars */}
          <div className="flex items-center gap-1 h-5">
            <div className="w-1 bg-cyan-400 h-3 animate-pulse"></div>
            <div className="w-1 bg-indigo-400 h-5 animate-pulse delay-75"></div>
            <div className="w-1 bg-cyan-400 h-2 animate-pulse delay-150"></div>
            <div className="w-1 bg-teal-400 h-4 animate-pulse"></div>
            <div className="w-1 bg-cyan-400 h-3 animate-pulse delay-100"></div>
          </div>
        </div>

        {/* Chat / Speech Dialogue History */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {chatLog.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[10px] text-slate-400 font-mono mb-1">
                {msg.sender === 'user' ? 'Citizen (Spoken)' : 'LifeGrid Voice AI'}
              </span>
              <div
                className={`p-4 rounded-2xl max-w-[85%] text-xs leading-relaxed font-medium ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600/30 text-cyan-100 border border-cyan-500/40 rounded-tr-none'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
              <span>Gemini Voice AI is reasoning & synthesizing response...</span>
            </div>
          )}
        </div>

        {/* Extracted Structured Data Bar (If any) */}
        {extractedData && (
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-[11px] grid grid-cols-3 gap-2">
            <div className="flex items-center gap-1.5 text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Injuries: <strong className="text-amber-400">{extractedData.extracted_injuries ? 'YES' : 'NO'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Injured Count: <strong className="text-white">{extractedData.extracted_injured_count}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ETA Help: <strong className="text-emerald-400">{extractedData.eta_minutes} mins</strong></span>
            </div>
          </div>
        )}

        {/* Quick Speech Prompt Presets */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Quick Spoken Simulation:</span>
          <button
            onClick={() => handleSendSpeech("We are trapped near Sector 2 flood underpass, water is rising rapidly!")}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap border border-slate-700 cursor-pointer"
          >
            "Trapped near underpass, water rising!"
          </button>
          <button
            onClick={() => handleSendSpeech("2 people are injured, children are with us. Send ambulance fast!")}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap border border-slate-700 cursor-pointer"
          >
            "2 injured, children present!"
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
          <input
            type="text"
            value={speechText}
            onChange={(e) => setSpeechText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendSpeech()}
            placeholder="Type spoken response simulation..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => handleSendSpeech()}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            <Send className="w-4 h-4" />
            <span>Speak</span>
          </button>
        </div>

      </div>
    </div>
  );
}
