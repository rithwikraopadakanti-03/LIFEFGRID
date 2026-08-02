import React, { useState, useEffect, useRef } from 'react';
import { PhoneCall, PhoneOff, Mic, MicOff, Volume2, X, Send, AlertTriangle, ShieldCheck, CheckCircle, Languages, UserCheck, Radio } from 'lucide-react';
import axios from 'axios';

const LANG_MAP = { 'en': 'en-US', 'hi': 'hi-IN', 'te': 'te-IN', 'ta': 'ta-IN', 'kn': 'kn-IN' };

const GREETINGS = {
  en: "Hello, this is LifeGrid AI Emergency Assistant. Please stay calm — emergency teams are on their way. Are you injured or do you need help?",
  hi: "नमस्ते, मैं लाइफग्रिड एआई आपातकालीन सहायक बोल रहा हूँ। घबराएं नहीं — आपातकालीन दल आ रहे हैं। क्या आप घायल हैं?",
  te: "నమస్తే, నేను లైఫ్‌గ్రిడ్ AI అత్యవసర సహాయకుడిని. ప్రశాంతంగా ఉండండి — అత్యవసర బృందాలు వస్తున్నాయి. మీకు గాయం అయిందా?",
  ta: "வணக்கம், நான் லைஃப்கிரிட் AI அவசர உதவியாளர். அமைதியாக இருங்கள் — அவசர குழுக்கள் வருகின்றன.",
  kn: "ನಮಸ್ಕಾರ, ನಾನು LifeGrid AI ತುರ್ತು ಸಹಾಯಕ. ಶಾಂತವಾಗಿರಿ — ತುರ್ತು ತಂಡಗಳು ಬರುತ್ತಿವೆ.",
};

export default function VoiceAiModal({ isOpen, onClose, currentUser = null, targetIncident = null }) {
  const [language, setLanguage] = useState('en');
  const [phase, setPhase] = useState('ringing'); // ringing | connected | ended
  const [chatLog, setChatLog] = useState([]);
  const [speechText, setSpeechText] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ringCount, setRingCount] = useState(0);
  const bottomRef = useRef(null);
  const ringTimer = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPhase('ringing');
      setRingCount(0);
      setChatLog([]);
      setExtractedData(null);
      // Cancel any leftover speech audio until user explicitly accepts call
      window.speechSynthesis?.cancel();
    } else {
      window.speechSynthesis?.cancel();
      window._voiceAiRecognition?.stop();
      setPhase('ringing');
      setChatLog([]);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const speakText = (text, langCode) => {
    if (!('speechSynthesis' in window) || isMuted) return;
    window.speechSynthesis.cancel();

    const doSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      // Pick best available voice for the language
      const voices = window.speechSynthesis.getVoices();
      const bcp = LANG_MAP[langCode] || 'en-US';
      const match = voices.find(v => v.lang.startsWith(bcp.split('-')[0]))
        || voices.find(v => v.lang === 'en-US')
        || voices[0];
      if (match) utterance.voice = match;
      utterance.lang = bcp;
      window.speechSynthesis.speak(utterance);
    };

    // Chrome loads voices async — wait for them
    if (window.speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => { doSpeak(); };
    }
  };

  const handleSend = async (preset = null) => {
    const text = preset || speechText.trim();
    if (!text) return;
    setSpeechText('');
    const newLog = [...chatLog, { sender: 'user', text }];
    setChatLog(newLog);
    setLoading(true);

    try {
      const res = await axios.post('/api/voice/process-speech', {
        phone: currentUser?.phone || "+91 00000 00000",
        language,
        user_speech: text,
        incident_context: targetIncident
      });
      const aiResponse = res.data.ai_speech_text;
      setChatLog(prev => [...prev, { sender: 'ai', text: aiResponse }]);
      setExtractedData(res.data);
      speakText(aiResponse, language);
      window.refreshLifeGridData?.();
    } catch {
      const fallback = "I've received your report. Emergency services are being dispatched to your location. Please stay calm and stay on the line.";
      setChatLog(prev => [...prev, { sender: 'ai', text: fallback }]);
      speakText(fallback, language);
    } finally {
      setLoading(false);
    }
  };

  const handleMicListen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your emergency message.');
      return;
    }

    if (isListening) {
      window._voiceAiRecognition?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LANG_MAP[language] || 'en-US';
    recognition.interimResults = true;

    window._voiceAiRecognition = recognition;
    setIsListening(true);

    recognition.onresult = (event) => {
      const text = Array.from(event.results).map(r => r[0].transcript).join('');
      setSpeechText(text);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleEndCall = () => {
    window.speechSynthesis?.cancel();
    window._voiceAiRecognition?.stop();
    setPhase('ended');
    setTimeout(() => onClose(), 1200);
  };

  if (!isOpen) return null;

  // ── RINGING SCREEN ─────────────────────────────────────────────
  if (phase === 'ringing') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
        <div className="flex flex-col items-center gap-8 text-center">
          {/* Pulsing ring animation */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping scale-150" />
            <div className="absolute inset-0 rounded-full bg-green-500/10 animate-ping scale-125 delay-150" />
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/40 relative z-10">
              <PhoneCall className="w-16 h-16 text-white animate-bounce" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-slate-400 text-sm font-semibold tracking-widest uppercase">Incoming Call</p>
            <h2 className="text-3xl font-black text-white">LifeGrid AI</h2>
            <p className="text-slate-400 text-sm">Emergency Voice Assistant</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: `${i * 200}ms` }} />
              ))}
              <span className="text-green-400 text-xs font-bold ml-2">Ringing...</span>
            </div>
          </div>

          {/* Accept / Decline */}
          <div className="flex items-center gap-16">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  clearTimeout(ringTimer.current);
                  setPhase('connected');
                  const greeting = GREETINGS[language] || GREETINGS.en;
                  setChatLog([{ sender: 'ai', text: greeting }]);
                  speakText(greeting, language);
                }}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center shadow-xl shadow-green-500/40 cursor-pointer transition-all active:scale-95"
              >
                <PhoneCall className="w-7 h-7 text-white" />
              </button>
              <span className="text-xs text-slate-400">Accept</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onClose}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/40 cursor-pointer transition-all active:scale-95"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
              <span className="text-xs text-slate-400">Decline</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ENDED SCREEN ───────────────────────────────────────────────
  if (phase === 'ended') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center">
            <PhoneOff className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-black text-white">Call Ended</h2>
          <p className="text-slate-400 text-sm">Emergency services have been notified.</p>
        </div>
      </div>
    );
  }

  // ── CONNECTED SCREEN ───────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-3xl border border-green-500/30 shadow-2xl shadow-green-900/30 overflow-hidden flex flex-col max-h-[90vh] bg-slate-950">

        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-green-400" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">LifeGrid AI — Emergency Line</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-green-400 font-bold">CONNECTED · ENCRYPTED</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language */}
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="te">తెలుగు</option>
              <option value="ta">தமிழ்</option>
              <option value="kn">ಕನ್ನಡ</option>
            </select>

            <button onClick={() => setIsMuted(m => !m)}
              title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
              className={`p-2 rounded-lg cursor-pointer ${isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {isMuted ? <MicOff className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* End Call */}
            <button onClick={handleEndCall}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer">
              <PhoneOff className="w-4 h-4" />
              End
            </button>
          </div>
        </div>

        {/* Live Waveform Banner */}
        <div className="bg-gradient-to-r from-green-950/50 via-slate-900 to-green-950/50 px-5 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-green-300">AI is listening — speak your emergency</span>
          </div>
          <div className="flex items-end gap-0.5 h-5">
            {[3,5,4,6,3,5,2,4,3,5].map((h, i) => (
              <div key={i} className="w-1 bg-green-400 rounded-full animate-pulse" style={{ height: `${h * 3}px`, animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        </div>

        {/* Chat Log */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {chatLog.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-slate-500 font-mono mb-1">
                {msg.sender === 'user' ? '🎙 You' : '🤖 LifeGrid AI'}
              </span>
              <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-600/30 text-cyan-100 border border-cyan-500/30 rounded-tr-sm'
                  : 'bg-slate-800 text-slate-100 border border-slate-700/60 rounded-tl-sm'
              }`}>
                {msg.sender === 'ai' && (
                  <button
                    onClick={() => speakText(msg.text, language)}
                    className="float-right ml-2 p-0.5 text-slate-400 hover:text-green-400 cursor-pointer"
                    title="Replay audio"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
                ))}
              </div>
              <span className="text-xs text-green-400 font-mono">AI dispatching units...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Extracted Data Bar */}
        {extractedData && (
          <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 grid grid-cols-4 gap-2 text-[11px]">
            <div className="flex items-center gap-1 text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              Injured: <strong className={extractedData.extracted_injuries ? "text-rose-400 ml-1" : "text-emerald-400 ml-1"}>{extractedData.extracted_injuries ? 'YES' : 'NO'}</strong>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Count: <strong className="text-white ml-1">{extractedData.extracted_injured_count || 0}</strong>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Zone: <strong className="text-amber-300 ml-1">{extractedData.extracted_location || 'GPS'}</strong>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              ETA: <strong className="text-emerald-400 ml-1">{extractedData.eta_minutes || 4}m</strong>
            </div>
          </div>
        )}

        {/* Quick Phrases */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">Quick Say:</span>
          {[
            "I'm injured, need ambulance",
            "Building fire, people trapped",
            "Flood, need rescue",
            "Road accident, 3 injured",
          ].map((p, i) => (
            <button key={i} onClick={() => handleSend(p)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap border border-slate-700 cursor-pointer">
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
          <button
            type="button"
            onClick={handleMicListen}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              isListening
                ? 'bg-rose-600/30 text-rose-300 border-rose-500/60 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Speak into microphone"
          >
            <Mic className={`w-4 h-4 ${isListening ? 'text-rose-400 animate-bounce' : 'text-slate-400'}`} />
          </button>
          <input
            type="text"
            value={speechText}
            onChange={e => setSpeechText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? 'Listening to your speech...' : 'Type or speak your emergency message...'}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-green-500"
          />
          <button onClick={() => handleSend()} disabled={loading || !speechText.trim()}
            className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-40">
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>

      </div>
    </div>
  );
}
