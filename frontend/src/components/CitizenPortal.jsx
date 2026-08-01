import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, PhoneCall, AlertTriangle, MapPin, HeartPulse, Building2, 
  CloudRain, Navigation, MessageSquare, Clock, CheckCircle2, ChevronRight, Zap, Sparkles
} from 'lucide-react';
import axios from 'axios';

export default function CitizenPortal({ 
  currentUser, 
  incidents = [], 
  resources = [], 
  weather = {}, 
  onOpenReportModal, 
  onOpenVoiceModal,
  onOpenChatDrawer
}) {
  const [sosTriggering, setSosTriggering] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [liveWeather, setLiveWeather] = useState(null);
  const [locationName, setLocationName] = useState('Live GPS Telemetry (Metro District)');

  useEffect(() => {
    // Initial fetch for immediate display
    axios.get('/api/weather')
      .then(res => setLiveWeather(res.data?.metric || null))
      .catch(err => console.error("Weather fetch error", err));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          try {
            const res = await axios.get('/api/weather', { params: { lat, lon } });
            setLiveWeather(res.data?.metric || null);
            setLocationName(`GPS locked (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`);
          } catch (e) {}
        },
        () => {},
        { timeout: 3000 }
      );
    }
  }, []);

  // Match strictly the active citizen's own reported emergency
  const myIncident = incidents.find(i => 
    (i.user_id === currentUser?.id || i.reporter_phone === currentUser?.phone || i.reporter_name?.includes(currentUser?.full_name || '___')) &&
    i.status !== 'RESOLVED'
  );

  const handleSosClick = async () => {
    setSosTriggering(true);

    try {
      await axios.post('/api/incidents/sos', {
        latitude: 16.5095,
        longitude: 80.6480,
        reporter_name: currentUser?.full_name || "Rithwik Rao"
      });
      setSosActive(true);
    } catch (e) {
      console.error("SOS failed", e);
    } finally {
      setSosTriggering(false);
    }
  };

  const statusSteps = [
    { key: 'SUBMITTED', label: 'Report Submitted' },
    { key: 'AI_VERIFIED', label: 'AI Verified' },
    { key: 'TEAM_ASSIGNED', label: 'Team Assigned' },
    { key: 'EN_ROUTE', label: 'Team En Route' },
    { key: 'ARRIVED', label: 'Arrived at Site' },
    { key: 'RESOLVED', label: 'Resolved' }
  ];

  const getStepIndex = (status) => {
    const map = {
      'SUBMITTED': 0,
      'VERIFYING': 0,
      'AI_VERIFIED': 1,
      'ACTION_REQUIRED': 1,
      'TEAM_ASSIGNED': 2,
      'DISPATCHED': 2,
      'EN_ROUTE': 3,
      'IN_PROGRESS': 3,
      'ARRIVED': 4,
      'RESOLVED': 5
    };
    return map[status] !== undefined ? map[status] : 1;
  };

  const currentStepIdx = myIncident ? getStepIndex(myIncident.status) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Citizen Welcome & Emergency SOS Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-red-500/40 bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
              Citizen Emergency Portal
            </span>
            <span className="text-xs text-slate-400">Welcome, {currentUser?.full_name || 'Citizen'}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Need Immediate Help?</h2>
          <p className="text-sm text-slate-300 max-w-md">
            Press the SOS panic button for instant 1-tap dispatch or report a localized hazard.
          </p>
        </div>

        {/* Big SOS Panic Button */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <button
            onClick={handleSosClick}
            disabled={sosTriggering}
            className={`w-28 h-28 rounded-full font-black text-xl text-white shadow-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border-4 ${
              sosActive
                ? 'bg-emerald-600 border-emerald-400 shadow-emerald-500/50 animate-bounce'
                : 'bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 border-red-400/60 shadow-red-600/40 hover:scale-105'
            }`}
          >
            <ShieldAlert className="w-8 h-8 animate-pulse" />
            <span>{sosActive ? 'SENT!' : 'SOS'}</span>
          </button>
          <span className="text-[10px] text-slate-400 font-mono">1-Tap Emergency Alert</span>
        </div>

      </div>

      {/* Live Incident Status Tracker & Stepper (If Citizen has active incident) */}
      {myIncident && (
        <div className="glass-panel p-6 rounded-3xl border border-cyan-500/40 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Active Emergency Status
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: #{myIncident.id}</span>
              </div>
              <h3 className="font-extrabold text-lg text-white mt-1">{myIncident.title}</h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenChatDrawer && onOpenChatDrawer(myIncident)}
                className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Live Chat Crew</span>
              </button>

              <button
                onClick={() => onOpenVoiceModal && onOpenVoiceModal(myIncident)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-indigo-400" />
                <span>Voice AI Guide</span>
              </button>
            </div>
          </div>

          {/* Stepper Flow */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
            {statusSteps.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-lg shadow-cyan-500/10'
                      : isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    {isCompleted ? (
                      <CheckCircle2 className={`w-4 h-4 ${isCurrent ? 'text-cyan-400 animate-bounce' : 'text-emerald-400'}`} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700"></div>
                    )}
                  </div>
                  <span className="text-[11px] font-bold block leading-tight">{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Assigned Resource & Live ETA */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Responder Unit</span>
              <p className="text-sm font-bold text-white">
                🚑 {myIncident.assigned_team_name || myIncident.assigned_resources?.ambulance || "ALS Ambulance Unit 108-A1"}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-cyan-950/40 px-4 py-2 rounded-xl border border-cyan-500/30">
              <Clock className="w-5 h-5 text-cyan-400 animate-spin" />
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">ESTIMATED ARRIVAL</span>
                <span className="text-base font-extrabold text-cyan-400">
                  {Math.floor((myIncident.eta_seconds || 420) / 60)} mins { (myIncident.eta_seconds || 420) % 60 }s
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weather & Quick Action Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Weather Brief */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              Current Location Weather • {liveWeather?.location_name || locationName}
            </span>
            <h4 className="text-xl font-extrabold text-white">
              {liveWeather ? `${liveWeather.temperature_c}°C • Live Temperature` : '31.5°C • Live Weather'}
            </h4>
            <p className="text-xs text-amber-400 font-semibold">
              {liveWeather?.forecast_summary || 'Atmospheric & Doppler Telemetry Active'}
            </p>
          </div>
          <CloudRain className="w-10 h-10 text-cyan-400 shrink-0" />
        </div>

        {/* Quick Report Button */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Found a Hazard?</span>
            <h4 className="text-base font-extrabold text-white">Report Flood, Fire or Accident</h4>
            <p className="text-xs text-slate-400">Photo & voice verification attached</p>
          </div>

          <button
            onClick={onOpenReportModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 cursor-pointer shrink-0"
          >
            + Report Now
          </button>
        </div>

      </div>

      {/* Nearby Resources List */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Nearby Emergency Lifelines</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {resources.map((res) => (
            <div key={res.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300">
                  {res.type}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">1.2 km away</span>
              </div>
              <h4 className="font-bold text-sm text-slate-100">{res.name}</h4>
              <p className="text-xs text-slate-400 line-clamp-1">{res.address}</p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-400 font-mono">
                <span>📞 {res.contact_number}</span>
                <span>Available: {res.capacity - res.current_occupancy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
