import React, { useState, useEffect } from 'react';
import { Cpu, CloudRain, HeartPulse, Droplets, ShieldCheck, PhoneCall, Compass, CheckCircle2, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function AgentMatrix() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coordinating, setCoordinating] = useState(false);

  const fetchAgentMatrix = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/agents/matrix');
      setAgents(res.data);
    } catch (e) {
      console.error("Failed to load agent matrix", e);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerCoordination = async () => {
    try {
      setCoordinating(true);
      await axios.post('/api/agents/coordinate');
      await fetchAgentMatrix();
    } catch (e) {
      console.error(e);
    } finally {
      setCoordinating(false);
    }
  };

  useEffect(() => {
    fetchAgentMatrix();
  }, []);

  const getAgentIcon = (name) => {
    if (name.includes("Weather")) return CloudRain;
    if (name.includes("Health")) return HeartPulse;
    if (name.includes("Water")) return Droplets;
    if (name.includes("Infrastructure")) return ShieldCheck;
    if (name.includes("Voice")) return PhoneCall;
    if (name.includes("Resource")) return Compass;
    return Cpu;
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Autonomous Multi-Agent System
            </span>
            <span className="text-xs text-slate-400">7 Active Specialized AI Agents</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">LifeGrid AI Multi-Agent Matrix</h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Instead of passive data streams, specialized AI agents continuously monitor environmental metrics, predict localized risks, collaborate on strategy, and synthesize unified emergency responses.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchAgentMatrix}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleTriggerCoordination}
            disabled={coordinating}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>{coordinating ? 'Synchronizing Agents...' : 'Trigger Multi-Agent Coordination'}</span>
          </button>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, idx) => {
          const Icon = getAgentIcon(agent.agent_name);
          const isCoordinator = agent.agent_name.includes("Coordinator");

          return (
            <div
              key={idx}
              className={`p-6 rounded-3xl border transition-all relative overflow-hidden ${
                isCoordinator
                  ? 'glass-card-accent border-cyan-500/50 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40'
                  : 'glass-panel border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top Row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${
                    isCoordinator ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 text-cyan-400 border border-slate-700'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">{agent.agent_name}</h3>
                    <p className="text-xs text-slate-400 font-medium">{agent.role}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {agent.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Confidence: {(agent.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Agent Reasoning Stream */}
              <div className="space-y-3">
                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Live Thought Reasoning
                  </span>
                  <p className="text-xs font-mono text-slate-200 leading-relaxed">
                    "{agent.last_thought}"
                  </p>
                </div>

                {/* Primary Recommendation Card */}
                <div className="bg-cyan-500/5 p-3 rounded-xl border border-cyan-500/20 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide block">Recommended Action</span>
                    <p className="text-xs font-medium text-slate-200">{agent.recommendation}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Metrics Analyzed: <strong className="text-white">{agent.metrics_analyzed} telemetry points</strong></span>
                <span className="flex items-center gap-1 text-cyan-400 font-semibold cursor-pointer">
                  View Logic Graph <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
