import React, { useState } from 'react';
import { 
  Building2, CheckCircle2, ShieldAlert, Navigation, PhoneCall, 
  MessageSquare, Clock, MapPin, AlertTriangle, ArrowRight, Zap, Check, Flame, Truck, Shield
} from 'lucide-react';
import axios from 'axios';

export default function TeamCommandCenter({ 
  currentUser, 
  incidents = [], 
  onSelectIncident,
  onOpenChatDrawer,
  onOpenVoiceModal,
  onRefreshData
}) {
  const [selectedDept, setSelectedDept] = useState(currentUser?.team_department || 'FIRE');
  const [updatingId, setUpdatingId] = useState(null);

  const departments = [
    { id: 'FIRE', label: 'Fire & Rescue', icon: Flame, color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
    { id: 'AMBULANCE', label: 'ALS Ambulance (108)', icon: Truck, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
    { id: 'POLICE', label: 'Police Control', icon: Shield, color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' },
    { id: 'HOSPITAL', label: 'Hospital ER', icon: Building2, color: 'text-purple-400 border-purple-500/40 bg-purple-500/10' },
    { id: 'DISASTER_RESPONSE', label: 'Disaster Force', icon: ShieldAlert, color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' }
  ];

  // Filter incidents matching selected department or all active emergencies
  const filteredIncidents = incidents.filter(i => {
    if (selectedDept === 'FIRE') return i.category === 'Fire' || i.category === 'Flood' || i.category === 'Gas Leak';
    if (selectedDept === 'AMBULANCE') return i.category === 'Medical Emergency' || i.category === 'Accident' || i.category === 'Flood';
    if (selectedDept === 'POLICE') return i.category === 'Accident' || i.category === 'Fire' || i.urgency === 'CRITICAL';
    if (selectedDept === 'HOSPITAL') return i.category === 'Medical Emergency' || i.severity_score >= 8;
    return true;
  });

  const handleStatusChange = async (incidentId, newStatus) => {
    setUpdatingId(incidentId);
    try {
      await axios.post(`/api/incidents/${incidentId}/status`, {
        status: newStatus,
        assigned_team_name: `${selectedDept} Rapid Dispatch Crew`,
        assigned_team_department: selectedDept,
        eta_seconds: newStatus === 'EN_ROUTE' ? 360 : newStatus === 'ARRIVED' ? 0 : 480
      });
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error("Status update failed", e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Operations Header */}
      <div className="glass-panel p-6 rounded-3xl border border-rose-500/30 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
              Emergency Team Operations Center
            </span>
            <span className="text-xs text-slate-400">Logged in as {currentUser?.full_name || 'Responder'}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Department Dispatch & Response Control</h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Accept incoming AI-verified emergencies, navigate GPS vectors, manage live en-route countdown status, and converse directly with stranded citizens.
          </p>
        </div>

        {/* Active Department Ticker */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center shrink-0">
          <span className="text-xs font-semibold text-slate-400 block">Pending Department Tasks</span>
          <span className="text-2xl font-extrabold text-rose-400">{filteredIncidents.length} Active</span>
        </div>
      </div>

      {/* Department Permission Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {departments.map((dept) => {
          const Icon = dept.icon;
          const isSelected = selectedDept === dept.id;
          return (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? `${dept.color} shadow-lg border shadow-cyan-500/10`
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{dept.label}</span>
            </button>
          );
        })}
      </div>

      {/* Incident Queue Cards with Action Buttons */}
      <div className="space-y-4">
        {filteredIncidents.map((inc) => {
          const isUpdating = updatingId === inc.id;

          return (
            <div
              key={inc.id}
              className={`glass-panel p-6 rounded-3xl border transition-all ${
                inc.status === 'EN_ROUTE' ? 'border-cyan-500/50 bg-cyan-950/20' :
                inc.status === 'ARRIVED' ? 'border-emerald-500/50 bg-emerald-950/20' :
                'border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Incident Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {inc.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID: #{inc.id}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-cyan-400">
                      State: {inc.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-lg text-white">{inc.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{inc.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1 text-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {inc.address || 'GPS Location Locked'}
                    </span>
                    <span>Reporter: <strong className="text-white">{inc.reporter_name} ({inc.reporter_phone})</strong></span>
                    <span>Severity: <strong className="text-rose-400">{inc.severity_score}/10</strong></span>
                  </div>
                </div>

                {/* Response Action Buttons State Machine */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                  
                  {/* Action 1: Accept Incident */}
                  {inc.status === 'SUBMITTED' || inc.status === 'AI_VERIFIED' ? (
                    <button
                      onClick={() => handleStatusChange(inc.id, 'TEAM_ASSIGNED')}
                      disabled={isUpdating}
                      className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 cursor-pointer"
                    >
                      Accept Incident
                    </button>
                  ) : null}

                  {/* Action 2: Mark En Route */}
                  {inc.status === 'TEAM_ASSIGNED' || inc.status === 'AI_VERIFIED' ? (
                    <button
                      onClick={() => handleStatusChange(inc.id, 'EN_ROUTE')}
                      disabled={isUpdating}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
                    >
                      Mark En Route
                    </button>
                  ) : null}

                  {/* Action 3: Mark Arrived */}
                  {inc.status === 'EN_ROUTE' ? (
                    <button
                      onClick={() => handleStatusChange(inc.id, 'ARRIVED')}
                      disabled={isUpdating}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 cursor-pointer"
                    >
                      Mark Arrived at Site
                    </button>
                  ) : null}

                  {/* Action 4: Mark Resolved */}
                  {inc.status === 'ARRIVED' || inc.status === 'EN_ROUTE' ? (
                    <button
                      onClick={() => handleStatusChange(inc.id, 'RESOLVED')}
                      disabled={isUpdating}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                  ) : null}

                  {/* Live Chat with Citizen */}
                  <button
                    onClick={() => onOpenChatDrawer && onOpenChatDrawer(inc)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer"
                    title="Live Chat with Citizen"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  {/* Call Citizen via Voice AI */}
                  <button
                    onClick={() => onOpenVoiceModal && onOpenVoiceModal(inc)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 cursor-pointer"
                    title="Call Citizen"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </button>

                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
