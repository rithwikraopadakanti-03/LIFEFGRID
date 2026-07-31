import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, MapPin, 
  PhoneCall, Zap, Send, Navigation, ChevronRight, Activity, Users, Truck
} from 'lucide-react';
import LiveMap from './LiveMap';

export default function CommandCenter({ 
  incidents = [], 
  resources = [], 
  analytics = {}, 
  onSelectIncident, 
  onOpenVoiceModal,
  onOpenReportModal
}) {
  const [selectedInc, setSelectedInc] = useState(incidents[0] || null);

  const handleIncidentClick = (inc) => {
    setSelectedInc(inc);
    if (onSelectIncident) onSelectIncident(inc);
  };

  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');
  const criticalCount = incidents.filter(i => i.urgency === 'CRITICAL').length;

  return (
    <div className="space-y-6">
      
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Active Incidents</p>
            <h3 className="text-xl font-extrabold text-white">{activeIncidents.length}</h3>
            <span className="text-[10px] text-red-400 font-medium">{criticalCount} Critical</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Avg Response Time</p>
            <h3 className="text-xl font-extrabold text-cyan-400">
              {analytics.summary?.avg_response_time_minutes || 6.8}m
            </h3>
            <span className="text-[10px] text-emerald-400 font-medium">-18% vs benchmark</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Available ICU Beds</p>
            <h3 className="text-xl font-extrabold text-emerald-400">36</h3>
            <span className="text-[10px] text-slate-400">District Hospitals</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Shelter Capacity</p>
            <h3 className="text-xl font-extrabold text-purple-400">1,740</h3>
            <span className="text-[10px] text-slate-400">Spots Available</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Ambulances Ready</p>
            <h3 className="text-xl font-extrabold text-rose-400">14</h3>
            <span className="text-[10px] text-emerald-400 font-medium">ALS + BLS units</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">AI Confidence</p>
            <h3 className="text-xl font-extrabold text-indigo-400">96.4%</h3>
            <span className="text-[10px] text-slate-400">Verified by Gemini</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Map & Live Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        
        {/* Left Column: Interactive GIS Map */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="h-[520px] relative">
            <LiveMap 
              incidents={incidents} 
              resources={resources} 
              selectedIncident={selectedInc}
              onSelectIncident={handleIncidentClick}
            />
          </div>

          {/* AI Autonomous Coordinator Action Banner */}
          {selectedInc && (
            <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                    Emergency Coordinator AI Response Plan
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Incident #{selectedInc.id}</span>
                </div>
                <p className="text-sm font-medium text-slate-200">
                  {selectedInc.ai_summary || "Autonomous response plan initialized. Dispatching nearest resources..."}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onOpenVoiceModal && onOpenVoiceModal(selectedInc)}
                  className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Citizen</span>
                </button>

                <button 
                  onClick={() => alert(`Autonomous Dispatch Executed for Incident #${selectedInc.id}!`)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-600/30 cursor-pointer"
                >
                  Execute Plan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Incident Feed & Resource Dispatch */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Live Emergency Stream</span>
            </h3>
            <button
              onClick={onOpenReportModal}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
            >
              + Report Incident
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[560px] pr-1">
            {incidents.map((inc) => {
              const isSelected = selectedInc?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => handleIncidentClick(inc)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'glass-card-accent border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                      : 'glass-panel border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                      inc.category === 'Flood' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      inc.category === 'Fire' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      inc.category === 'Accident' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }`}>
                      {inc.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400">Severity {inc.severity_score}/10</span>
                      <span className={`w-2 h-2 rounded-full ${
                        inc.urgency === 'CRITICAL' ? 'bg-red-500 animate-ping' :
                        inc.urgency === 'HIGH' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></span>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-100 mb-1 leading-snug">{inc.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2 mb-3">{inc.description}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span className="truncate max-w-[140px]">{inc.address || 'Detected Coordinates'}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {inc.status}
                    </span>
                  </div>

                  {inc.assigned_resources && Object.keys(inc.assigned_resources).length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/40 flex flex-wrap gap-1.5 text-[10px]">
                      {inc.assigned_resources.ambulance && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          🚑 {inc.assigned_resources.ambulance}
                        </span>
                      )}
                      {inc.assigned_resources.hospital && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          🏥 {inc.assigned_resources.hospital}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}
