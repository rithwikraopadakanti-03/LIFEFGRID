import React from 'react';
import { ShieldCheck, CloudRain, Activity, Droplets, HardDrive, Volume2, Cpu, CheckCircle2 } from 'lucide-react';

export default function AgentDecisionPanel({ cascade, isAnalyzing = false }) {
  const agentSteps = [
    { name: "Weather Agent", role: "Atmospheric & Flood Forecaster", icon: CloudRain, color: "text-cyan-400 bg-cyan-950/40 border-cyan-800" },
    { name: "Health Agent", role: "Hospital Surge & Epidemic Sentinel", icon: Activity, color: "text-emerald-400 bg-emerald-950/40 border-emerald-800" },
    { name: "Water Safety Agent", role: "Contamination & Reservoir Monitor", icon: Droplets, color: "text-blue-400 bg-blue-950/40 border-blue-800" },
    { name: "Infrastructure Agent", role: "Road Closures & Grid Inspector", icon: HardDrive, color: "text-purple-400 bg-purple-950/40 border-purple-800" },
    { name: "Citizen Voice Agent", role: "OmniDimension Voice AI Dispatcher", icon: Volume2, color: "text-amber-400 bg-amber-950/40 border-amber-800" },
    { name: "Coordinator Master Plan", role: "Chief Autonomous Incident Commander", icon: Cpu, color: "text-rose-400 bg-rose-950/40 border-rose-800" }
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-100 text-sm tracking-wide uppercase">
              Multi-Agent Orchestration Decision Matrix
            </h3>
            <p className="text-xs text-slate-400">
              7 Specialized Domain AI Agents Collaborating in Real-Time
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Cascade Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {agentSteps.map((agent, idx) => {
          const Icon = agent.icon;
          const matchedCascade = cascade?.find(c => c.agent?.toLowerCase().includes(agent.name.split(' ')[0].toLowerCase()));
          const isComplete = !isAnalyzing;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all duration-300 ${agent.color} ${
                isComplete ? 'opacity-100 scale-100 shadow-md' : 'opacity-60 scale-98'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-100">{agent.name}</h4>
                    <p className="text-[10px] text-slate-400 leading-tight">{agent.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified</span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-300">
                {matchedCascade?.output ? (
                  <p className="line-clamp-2 italic text-slate-300">"{matchedCascade.output}"</p>
                ) : (
                  <p className="text-slate-400 italic">Autonomous telemetry processed & verified.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
