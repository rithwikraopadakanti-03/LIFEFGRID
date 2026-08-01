import React, { useState, useEffect, useRef } from 'react';
import { Zap, Play, Pause, RotateCcw, X, CheckCircle2, Loader, Radio } from 'lucide-react';
import axios from 'axios';

const DEMO_STEPS = [
  {
    id: 0,
    icon: '📱',
    title: 'Citizen Reports Emergency',
    description: 'A citizen submits a critical SOS emergency report via LifeGrid AI portal. GPS coordinates captured automatically.',
    duration: 2500,
    color: 'from-rose-600 to-red-600',
    border: 'border-rose-500/40',
    agent: null,
  },
  {
    id: 1,
    icon: '🧠',
    title: 'AI Verification Engine',
    description: 'Gemini AI cross-checks the report against weather, infrastructure, and historical data. Confidence: 99%. Severity: 10/10.',
    duration: 2500,
    color: 'from-indigo-600 to-violet-600',
    border: 'border-indigo-500/40',
    agent: 'WEATHER + HEALTH + INFRA AGENTS',
  },
  {
    id: 2,
    icon: '🤖',
    title: 'Multi-Agent Coordination',
    description: '8 AI agents analyze data streams simultaneously: Weather, Health, Water, Infrastructure, Voice, Resource, Dispatcher, Coordinator.',
    duration: 3000,
    color: 'from-cyan-600 to-blue-600',
    border: 'border-cyan-500/40',
    agent: 'ALL 8 AGENTS',
  },
  {
    id: 3,
    icon: '🚑',
    title: 'Smart Dispatcher Selects Best Resource',
    description: 'Dispatcher AI scores 6 providers (108 Govt, Apollo, Fortis, Blinkit). Apollo ALS selected: 2.3 km, ICU + ALS, ETA 6 mins.',
    duration: 2500,
    color: 'from-amber-600 to-orange-600',
    border: 'border-amber-500/40',
    agent: 'DISPATCHER AGENT',
  },
  {
    id: 4,
    icon: '📞',
    title: 'AI Voice Agent Calls Citizen',
    description: 'Voice AI contacts citizen in their preferred language. "Help is on the way. ETA 6 minutes. Stay calm and stay on the line."',
    duration: 2500,
    color: 'from-violet-600 to-purple-600',
    border: 'border-violet-500/40',
    agent: 'VOICE AI AGENT',
  },
  {
    id: 5,
    icon: '🗺️',
    title: 'Vehicle Dispatched — Live Tracking',
    description: 'Apollo ALS ambulance departs. Live GPS tracking activated. Team Command Center shows real-time vehicle movement on map.',
    duration: 2500,
    color: 'from-teal-600 to-emerald-600',
    border: 'border-teal-500/40',
    agent: 'LIVE TRACKING',
  },
  {
    id: 6,
    icon: '🏥',
    title: 'Hospital ER Pre-Alert',
    description: 'District Government Hospital ER automatically pre-alerted. Trauma bay reserved. ICU coordinator on standby.',
    duration: 2000,
    color: 'from-pink-600 to-rose-600',
    border: 'border-pink-500/40',
    agent: 'COORDINATOR AGENT',
  },
  {
    id: 7,
    icon: '✅',
    title: 'Incident Resolved',
    description: 'Emergency team arrives at scene. Patient transported. Incident marked RESOLVED. Total response time: 8 minutes.',
    duration: 2000,
    color: 'from-emerald-600 to-green-600',
    border: 'border-emerald-500/40',
    agent: null,
  },
  {
    id: 8,
    icon: '📊',
    title: 'AI Post-Incident Report',
    description: 'LifeGrid AI generates full incident report: Timeline, decisions, resources, lessons learned, future recommendations. Ready to download.',
    duration: 2000,
    color: 'from-slate-600 to-slate-700',
    border: 'border-slate-500/40',
    agent: 'REPORT AGENT',
  },
];

export default function DemoModeController({ onClose, onIncidentCreated }) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [demoIncidentId, setDemoIncidentId] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef(null);
  const stepRef = useRef(0);

  const startDemo = async () => {
    setCurrentStep(-1);
    setCompletedSteps([]);
    setIsComplete(false);
    setIsRunning(true);
    setIsPaused(false);

    // Create backend demo incident
    try {
      const res = await axios.post('/api/demo/trigger-scenario');
      setDemoIncidentId(res.data.incident_id);
      if (onIncidentCreated) onIncidentCreated();
    } catch { /* continue anyway */ }

    stepRef.current = 0;
    runStep(0);
  };

  const runStep = (step) => {
    if (step >= DEMO_STEPS.length) {
      setIsRunning(false);
      setIsComplete(true);
      return;
    }
    setCurrentStep(step);
    timerRef.current = setTimeout(() => {
      setCompletedSteps(prev => [...prev, step]);
      stepRef.current = step + 1;
      runStep(step + 1);
    }, DEMO_STEPS[step].duration);
  };

  const handlePause = () => {
    if (isPaused) {
      setIsPaused(false);
      runStep(stepRef.current);
    } else {
      setIsPaused(true);
      clearTimeout(timerRef.current);
    }
  };

  const handleReset = () => {
    clearTimeout(timerRef.current);
    setCurrentStep(-1);
    setCompletedSteps([]);
    setIsRunning(false);
    setIsPaused(false);
    setIsComplete(false);
    stepRef.current = 0;
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-cyan-500/30 bg-slate-950 shadow-2xl shadow-cyan-900/40 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Hackathon WOW Mode</h2>
              <p className="text-[11px] text-slate-400">Automated Emergency Response Simulation</p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
              JUDGES DEMO
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {DEMO_STEPS.map((step, i) => {
            const isDone = completedSteps.includes(i);
            const isActive = currentStep === i;

            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-4 rounded-2xl border transition-all duration-500 ${
                  isDone
                    ? 'bg-emerald-950/30 border-emerald-500/30'
                    : isActive
                    ? `bg-gradient-to-r ${step.color} bg-opacity-20 ${step.border} shadow-lg`
                    : 'bg-slate-900/40 border-slate-800/60 opacity-40'
                }`}
              >
                {/* Step indicator */}
                <div className="shrink-0 mt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isActive ? (
                    <Loader className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-700 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-slate-500">{i + 1}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">{step.icon}</span>
                    <span className={`text-sm font-extrabold ${isDone ? 'text-emerald-300' : isActive ? 'text-white' : 'text-slate-500'}`}>
                      {step.title}
                    </span>
                    {step.agent && isActive && (
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 animate-pulse" />
                        {step.agent}
                      </span>
                    )}
                    {isDone && (
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        COMPLETED
                      </span>
                    )}
                  </div>
                  <p className={`text-xs leading-relaxed mt-1 ${isDone ? 'text-emerald-200/70' : isActive ? 'text-slate-200' : 'text-slate-600'}`}>
                    {step.description}
                  </p>
                  {/* Progress bar for active step */}
                  {isActive && (
                    <div className="mt-2 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/60 rounded-full"
                        style={{
                          animation: `progress-fill ${step.duration}ms linear forwards`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isComplete && (
            <div className="p-6 rounded-3xl border border-emerald-500/40 bg-emerald-950/30 text-center space-y-2">
              <div className="text-4xl">🎯</div>
              <h3 className="text-lg font-extrabold text-emerald-300">Demo Complete!</h3>
              <p className="text-xs text-emerald-200/70">
                Full emergency lifecycle demonstrated: Report → AI Verify → Dispatch → Track → Resolve → Report
                {demoIncidentId && ` · Demo Incident #${demoIncidentId} created in live database.`}
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center gap-3 shrink-0">
          {!isRunning && !isComplete && (
            <button
              onClick={startDemo}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 cursor-pointer transition-all"
            >
              <Zap className="w-4 h-4" />
              Launch Demo Sequence
            </button>
          )}
          {isRunning && (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm cursor-pointer"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}
          {(isRunning || isComplete) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
          {isComplete && (
            <button
              onClick={startDemo}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-extrabold text-sm cursor-pointer"
            >
              <Play className="w-4 h-4" />
              Run Again
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes progress-fill {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </div>
  );
}
