import React, { useState } from 'react';
import { History, ShieldCheck, Cpu, MapPin, CheckCircle2, Clock, FileText, User } from 'lucide-react';

export default function EmergencyTimeline({ incidents = [] }) {
  const [selectedIncId, setSelectedIncId] = useState(incidents[0]?.id || null);

  const selectedIncident = incidents.find(i => i.id === selectedIncId) || incidents[0];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Autonomous Audit Trail
            </span>
            <span className="text-xs text-slate-400">Immutable Incident Logs</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Emergency Response Timeline</h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Every citizen report, AI verification score, agent dispatch command, and authority action is timestamped and stored for operational transparency.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center shrink-0">
          <span className="text-xs font-semibold text-slate-400 block">Total Audited Events</span>
          <span className="text-2xl font-extrabold text-cyan-400">
            {incidents.reduce((acc, i) => acc + (i.timeline ? i.timeline.length : 0), 0)}
          </span>
        </div>
      </div>

      {/* Main Grid: Incident List & Timeline Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Select Incident */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Select Incident to Audit</h3>
          <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
            {incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncId(inc.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'glass-card-accent border-cyan-500/50 shadow-md shadow-cyan-500/10'
                      : 'glass-panel border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-cyan-400">#{inc.id} • {inc.category}</span>
                    <span className="text-[10px] text-slate-400">{inc.urgency}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-100 line-clamp-1">{inc.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1">{inc.address}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Timeline Stream */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          
          {selectedIncident ? (
            <>
              {/* Incident Header Info */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-400 uppercase">
                      {selectedIncident.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID: #{selectedIncident.id}</span>
                  </div>
                  <h3 className="font-extrabold text-lg text-white">{selectedIncident.title}</h3>
                  <p className="text-xs text-slate-300">{selectedIncident.description}</p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                    Status: {selectedIncident.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Severity Rating: {selectedIncident.severity_score}/10
                  </span>
                </div>
              </div>

              {/* Timeline Events Vertical Tree */}
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-800">
                {selectedIncident.timeline && selectedIncident.timeline.length > 0 ? (
                  selectedIncident.timeline.map((event, idx) => (
                    <div key={event.id || idx} className="relative flex items-start gap-4 pl-12">
                      {/* Timeline Node Icon */}
                      <div className="absolute left-3 -translate-x-1/2 p-2 rounded-full bg-slate-900 border border-cyan-500/50 text-cyan-400 z-10">
                        {event.agent_name.includes("Gemini") ? <ShieldCheck className="w-4 h-4" /> :
                         event.agent_name.includes("Coordinator") ? <Cpu className="w-4 h-4" /> :
                         <Clock className="w-4 h-4" />}
                      </div>

                      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex-1 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-cyan-400">{event.agent_name}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-100">{event.action}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{event.details}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic pl-12">No timeline events recorded yet.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">Select an incident to view its full response timeline.</p>
          )}

        </div>

      </div>

    </div>
  );
}
