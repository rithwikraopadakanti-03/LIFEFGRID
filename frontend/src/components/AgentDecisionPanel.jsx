import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, CloudRain, Activity, Droplets, HardDrive,
  Volume2, Cpu, CheckCircle2, Loader, Truck, ArrowDown
} from 'lucide-react';

const AGENT_CHAIN = [
  {
    name: "Emergency Report",
    role: "Citizen SOS Received",
    icon: ShieldCheck,
    color: "text-rose-400",
    bg: "bg-rose-950/40",
    border: "border-rose-800/60",
    delay: 0,
    isReport: true
  },
  {
    name: "Weather Agent",
    role: "Atmospheric & Flood Risk Scan",
    icon: CloudRain,
    color: "text-cyan-400",
    bg: "bg-cyan-950/40",
    border: "border-cyan-800/60",
    delay: 300,
    confidence: 95
  },
  {
    name: "Health Agent",
    role: "Hospital Surge & Epidemic Sentinel",
    icon: Activity,
    color: "text-emerald-400",
    bg: "bg-emerald-950/40",
    border: "border-emerald-800/60",
    delay: 600,
    confidence: 92
  },
  {
    name: "Infrastructure Agent",
    role: "Road Closures & Power Grid Inspector",
    icon: HardDrive,
    color: "text-purple-400",
    bg: "bg-purple-950/40",
    border: "border-purple-800/60",
    delay: 900,
    confidence: 96
  },
  {
    name: "Water Safety Agent",
    role: "Contamination & Reservoir Monitor",
    icon: Droplets,
    color: "text-blue-400",
    bg: "bg-blue-950/40",
    border: "border-blue-800/60",
    delay: 1200,
    confidence: 94
  },
  {
    name: "Resource Locator",
    role: "GIS Fleet Positioning & Routing",
    icon: ShieldCheck,
    color: "text-indigo-400",
    bg: "bg-indigo-950/40",
    border: "border-indigo-800/60",
    delay: 1500,
    confidence: 97
  },
  {
    name: "Smart Dispatcher",
    role: "Multi-Provider Selection Engine",
    icon: Truck,
    color: "text-amber-400",
    bg: "bg-amber-950/40",
    border: "border-amber-800/60",
    delay: 1800,
    confidence: 97
  },
  {
    name: "Voice AI Agent",
    role: "Citizen Contact & Casualty Extraction",
    icon: Volume2,
    color: "text-violet-400",
    bg: "bg-violet-950/40",
    border: "border-violet-800/60",
    delay: 2100,
    confidence: 98
  },
  {
    name: "Coordinator Agent",
    role: "Generating Final Emergency Plan...",
    icon: Cpu,
    color: "text-rose-300",
    bg: "bg-rose-950/60",
    border: "border-rose-700/60",
    delay: 2400,
    confidence: 99,
    isFinal: true
  },
];

export default function AgentDecisionPanel({ cascade, isAnalyzing = false }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [chainRunning, setChainRunning] = useState(false);

  useEffect(() => {
    if (isAnalyzing) {
      setChainRunning(true);
      setVisibleCount(0);
      setCompletedCount(0);
      AGENT_CHAIN.forEach((agent, i) => {
        setTimeout(() => setVisibleCount(v => Math.max(v, i + 1)), agent.delay);
        setTimeout(() => setCompletedCount(v => Math.max(v, i + 1)), agent.delay + 800);
      });
    } else {
      setVisibleCount(AGENT_CHAIN.length);
      setCompletedCount(AGENT_CHAIN.length);
    }
  }, [isAnalyzing]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-100 text-sm tracking-wide uppercase">
              AI Decision Cascade
            </h3>
            <p className="text-xs text-slate-400">
              8 Specialized AI Agents — Sequential Verification Chain
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Live Cascade
        </span>
      </div>

      {/* Vertical chain layout */}
      <div className="space-y-1">
        {AGENT_CHAIN.map((agent, idx) => {
          const Icon = agent.icon;
          const isVisible = visibleCount > idx;
          const isCompleted = completedCount > idx;
          const isActive = visibleCount === idx + 1 && !isCompleted;
          const matchedCascade = cascade?.find(c =>
            c.agent?.toLowerCase().includes(agent.name.split(' ')[0].toLowerCase())
          );
          const isFinalAgent = agent.isFinal;

          return (
            <div key={idx}>
              {/* Agent Step */}
              <div
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${
                  !isVisible
                    ? 'opacity-0 scale-95'
                    : isCompleted
                    ? `opacity-100 ${agent.bg} ${agent.border}`
                    : isActive
                    ? `opacity-100 ${agent.bg} ${agent.border} shadow-lg`
                    : 'opacity-0'
                }`}
              >
                {/* Status icon */}
                <div className="shrink-0">
                  {isCompleted && !isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isActive ? (
                    <Loader className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-700" />
                  )}
                </div>

                {/* Agent icon */}
                <div className={`p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 ${agent.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold ${agent.color}`}>
                      {agent.name}
                      {isFinalAgent && isActive && <span className="ml-1 text-[10px] animate-pulse">●</span>}
                    </span>
                    {agent.confidence && isCompleted && (
                      <span className="text-[10px] font-bold text-emerald-400 shrink-0">
                        {agent.confidence}%
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{agent.role}</p>
                  {/* Confidence bar */}
                  {agent.confidence && isCompleted && (
                    <div className="mt-1 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${agent.confidence}%` }}
                      />
                    </div>
                  )}
                  {/* Cascade output */}
                  {matchedCascade?.output && isCompleted && (
                    <p className="text-[10px] text-slate-300 italic mt-1 line-clamp-1">
                      "{matchedCascade.output}"
                    </p>
                  )}
                </div>
              </div>

              {/* Arrow connector (except after last) */}
              {idx < AGENT_CHAIN.length - 1 && isVisible && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown className={`w-3.5 h-3.5 transition-colors duration-300 ${isCompleted ? 'text-emerald-600' : 'text-slate-700'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Final Recommendation Banner */}
      {completedCount >= AGENT_CHAIN.length && (
        <div className="mt-4 p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <span className="text-xs font-extrabold text-emerald-300 block">Recommendation Ready</span>
            <p className="text-[11px] text-emerald-200/70">
              All 8 agents completed. Multi-agent consensus achieved with 99% confidence.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
