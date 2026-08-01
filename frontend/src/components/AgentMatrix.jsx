import React, { useState, useEffect } from 'react';
import { Cpu, CloudRain, HeartPulse, Droplets, ShieldCheck, PhoneCall, Compass, CheckCircle2, Zap, ArrowRight, RefreshCw, X, ShieldAlert, Network, Layers, Truck } from 'lucide-react';
import axios from 'axios';

export default function AgentMatrix() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coordinating, setCoordinating] = useState(false);
  
  // Interactive Modals
  const [coordinationResult, setCoordinationResult] = useState(null);
  const [selectedLogicAgent, setSelectedLogicAgent] = useState(null);

  const fetchAgentMatrix = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/agents/matrix');
      setAgents(res.data || []);
    } catch (e) {
      console.error("Failed to load agent matrix", e);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerCoordination = async () => {
    try {
      setCoordinating(true);
      const res = await axios.post('/api/agents/coordinate');
      setCoordinationResult(res.data);
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
    if (name.includes("Dispatcher")) return Truck;
    return Cpu;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/40 bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Autonomous Multi-Agent System
            </span>
            <span className="text-xs text-slate-400">8 Active Specialized AI Agents</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">LifeGrid AI Multi-Agent Matrix</h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Instead of passive data streams, specialized AI agents continuously monitor environmental metrics, predict localized risks, collaborate on strategy, and synthesize unified emergency responses.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchAgentMatrix}
            disabled={loading}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Refresh Matrix Telemetry"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleTriggerCoordination}
            disabled={coordinating}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-2 cursor-pointer transition-all border border-cyan-400/40"
          >
            <Zap className={`w-4 h-4 text-cyan-300 ${coordinating ? 'animate-bounce' : ''}`} />
            <span>{coordinating ? 'Synthesizing Consensus...' : 'Trigger Multi-Agent Coordination'}</span>
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
                <button
                  onClick={() => setSelectedLogicAgent(agent)}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer border-0 bg-transparent"
                >
                  View Logic Graph <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 1. Multi-Agent Coordination Master Plan Modal */}
      {coordinationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl glass-panel rounded-3xl border border-cyan-500/50 shadow-2xl overflow-hidden space-y-5 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
                  <Network className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">Multi-Agent Consensus Matrix Plan</h3>
                  <span className="text-xs text-emerald-400 font-mono">
                    Consensus Score: {(coordinationResult.consensus_score * 100).toFixed(1)}% Match
                  </span>
                </div>
              </div>

              <button
                onClick={() => setCoordinationResult(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300">Primary Synthesized Threat Vector</span>
                <span className="px-2.5 py-0.5 text-xs font-extrabold uppercase rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  {coordinationResult.primary_threat}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Unified Multi-Agent Directives</span>
                {coordinationResult.directives?.map((d, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Consensus Locked • Haversine GIS Vectors Synced</span>
              <button
                onClick={() => {
                  alert("Multi-Agent Response Plan Broadcasted to All Command Centers!");
                  setCoordinationResult(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                Execute Unified Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Agent Logic Graph Modal */}
      {selectedLogicAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl glass-panel rounded-3xl border border-blue-500/50 shadow-2xl overflow-hidden space-y-5 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">{selectedLogicAgent.agent_name} Logic Graph</h3>
                  <span className="text-xs text-slate-400">{selectedLogicAgent.role}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedLogicAgent(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Neural Reasoning Pipeline */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Step 1: Ingestion & Telemetry</span>
                <p className="text-xs text-slate-300 font-mono">
                  Analyzed {selectedLogicAgent.metrics_analyzed} live sensor telemetry data points across district.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Step 2: Neural Reasoning</span>
                <p className="text-xs text-slate-300 font-mono">
                  "{selectedLogicAgent.last_thought}"
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Step 3: Actionable Directive</span>
                <p className="text-xs font-bold text-emerald-200">
                  {selectedLogicAgent.recommendation}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Confidence: <strong className="text-white">{(selectedLogicAgent.confidence * 100).toFixed(0)}%</strong></span>
              <button
                onClick={() => setSelectedLogicAgent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Logic View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
