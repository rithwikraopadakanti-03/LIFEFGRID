import React, { useState, useEffect } from 'react';
import { 
  Truck, ShieldAlert, CheckCircle2, Clock, MapPin, PhoneCall, Zap, 
  Navigation, AlertTriangle, Cpu, HelpCircle, Layers, ChevronRight, Activity, ArrowUpRight
} from 'lucide-react';
import axios from 'axios';

export default function DispatcherPanel({ incident, onDispatchSuccess, onOpenVoiceModal }) {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (incident?.id) {
      setLoading(true);
      axios.get(`/api/dispatch/incident/${incident.id}`)
        .then(res => {
          setRecommendation(res.data);
        })
        .catch(err => {
          console.error("Dispatch recommendation fetch error", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [incident]);

  const handleApproveDispatch = async (provObj = null) => {
    if (!recommendation?.id) return;
    setApproving(true);
    try {
      const payload = provObj ? { provider_name: provObj.provider_name, vehicle_id: provObj.vehicle_id } : {};
      const res = await axios.post(`/api/dispatch/approve/${recommendation.id}`, payload);
      setRecommendation(res.data.recommendation);
      if (onDispatchSuccess) onDispatchSuccess(res.data.recommendation);
      if (window.refreshLifeGridData) window.refreshLifeGridData();
    } catch (e) {
      console.error("Dispatch approval error", e);
    } finally {
      setApproving(false);
    }
  };

  const handleSimulateStep = async () => {
    if (!recommendation?.id) return;
    setSimulating(true);
    try {
      const res = await axios.post(`/api/dispatch/simulate-step/${recommendation.id}`);
      setRecommendation(res.data.recommendation);
      if (window.refreshLifeGridData) window.refreshLifeGridData();
    } catch (e) {
      console.error("Dispatch simulation step error", e);
    } finally {
      setSimulating(false);
    }
  };

  if (!incident) return null;

  const rec = recommendation || {};
  const status = rec.status || 'BEST_RESOURCE_FOUND';
  const confidence = Math.round((rec.confidence_score || 0.97) * 100);

  const statusMap = {
    'BEST_RESOURCE_FOUND': { label: 'AI Best Resource Identified', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
    'PROVIDER_ASSIGNED': { label: 'Provider Assigned', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    'VEHICLE_DISPATCHED': { label: 'Vehicle Dispatched', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    'VEHICLE_EN_ROUTE': { label: 'Vehicle En Route (Live Animated Route)', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    'VEHICLE_ARRIVED': { label: 'Vehicle Arrived at Scene', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    'PATIENT_TRANSPORTED': { label: 'Patient Transported to ER', bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
    'INCIDENT_CLOSED': { label: 'Incident Closed & Cleared', bg: 'bg-slate-800 text-slate-300 border-slate-700' }
  };

  const currentStatusInfo = statusMap[status] || statusMap['BEST_RESOURCE_FOUND'];

  return (
    <div className="glass-panel p-6 rounded-3xl border border-cyan-500/40 space-y-6 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-900 shadow-2xl">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
              AI Smart Emergency Dispatcher
            </span>
            <span className="text-xs text-slate-400 font-mono">Multi-Provider Intelligent Matcher</span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>{incident.title}</span>
            <span className="text-xs text-slate-400 font-normal">#{incident.id}</span>
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 block font-semibold">AI Match Confidence</span>
            <span className="text-base font-black text-cyan-400">{confidence}% Match</span>
          </div>

          <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold ${currentStatusInfo.bg}`}>
            {currentStatusInfo.label}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-cyan-400 font-mono animate-pulse">
            Dispatcher Agent is scanning multi-provider database (108 Govt, Apollo, Fortis, Blinkit)...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Recommended Provider Live Card & Operator Actions */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Main Recommended Unit Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/40 relative overflow-hidden space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    <Truck className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest block">Recommended Provider</span>
                    <h3 className="text-lg font-black text-white">{rec.provider_name || 'Apollo Emergency ALS'}</h3>
                    <p className="text-xs text-slate-400 font-mono">Vehicle ID: <strong className="text-slate-200">{rec.vehicle_id || 'AP-09-AP-9901'}</strong></p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-semibold">Estimated Arrival</span>
                  <span className="text-2xl font-black text-emerald-400">{rec.eta_minutes || 6} Mins</span>
                  <span className="text-[10px] text-slate-400 block">{rec.distance_km || 2.3} km away</span>
                </div>
              </div>

              {/* Provider Specs Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Driver / Chief</span>
                  <span className="font-extrabold text-slate-100 text-[11px] truncate block">{rec.driver_name || 'Officer Vikram Singh'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Equipment Level</span>
                  <span className="font-extrabold text-cyan-300 text-[11px] block">ALS + ICU Ventilator</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Traffic Route</span>
                  <span className="font-extrabold text-emerald-300 text-[11px] truncate block">{rec.best_route_name || 'NH65 Express'}</span>
                </div>
              </div>

              {/* Control Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                {status === 'BEST_RESOURCE_FOUND' || status === 'SUBMITTED' || status === 'AI_VERIFIED' ? (
                  <button
                    onClick={handleApproveDispatch}
                    disabled={approving}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{approving ? 'Approving Dispatch...' : 'Approve & Dispatch Provider'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSimulateStep}
                    disabled={simulating}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Activity className="w-4 h-4" />
                    <span>{simulating ? 'Simulating Progress...' : `Advance Vehicle Status (${status})`}</span>
                  </button>
                )}

                <button
                  onClick={() => onOpenVoiceModal && onOpenVoiceModal(incident)}
                  className="py-3 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Call Citizen</span>
                </button>
              </div>

            </div>

            {/* Multi-Provider Comparison Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Multi-Provider Decision Matrix</span>
              </h4>

              <div className="space-y-2">
                {(rec.comparison_matrix || [
                  { provider_name: "Apollo Emergency ALS", vehicle_id: "AP-09-AP-9901", distance_km: 2.3, eta_minutes: 6, is_als: true, score: 98.5, status: "RECOMMENDED" },
                  { provider_name: "Government 108 ALS Service", vehicle_id: "AP-09-AM-1082", distance_km: 2.8, eta_minutes: 8, is_als: true, score: 92.1, status: "ALTERNATIVE" },
                  { provider_name: "Blinkit Rapid Ambulance (Demo)", vehicle_id: "AP-09-BK-1102", distance_km: 1.8, eta_minutes: 5, is_als: false, score: 84.0, status: "ALTERNATIVE" },
                  { provider_name: "Fortis ICU Ambulance", vehicle_id: "AP-09-FT-8812", distance_km: 3.4, eta_minutes: 9, is_als: true, score: 81.5, status: "ALTERNATIVE" }
                ]).map((prov, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    prov.status === 'RECOMMENDED'
                      ? 'bg-slate-900 border-cyan-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        idx === 0 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-extrabold text-slate-200 block">{prov.provider_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{prov.vehicle_id} • {prov.is_als ? 'ALS + ICU' : 'BLS Unit'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="font-bold text-white block">{prov.eta_minutes} Mins</span>
                        <span className="text-[10px] text-slate-400">{prov.distance_km} km</span>
                      </div>

                      {prov.status === 'RECOMMENDED' ? (
                        <span className="px-2 py-0.5 text-[9px] font-black rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          BEST CHOICE
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApproveDispatch(prov)}
                          className="px-2 py-1 text-[10px] font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        >
                          Select Provider
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: AI Explanation Panel ("WHY") */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>AI Dispatch Explanation ("WHY")</span>
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{rec.recommendation_reason || `Recommended Apollo Emergency ALS (AP-09-AP-9901) as nearest available unit within 2.3 km equipped with ALS & ICU capability. Route clear via NH65 Express Corridor with 6 min ETA.`}"
              </p>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Decision Factors Evaluated:</span>
                {(rec.detailed_justification || [
                  "Distance: 2.3 km (Nearest available unit)",
                  "Equipment: Advanced Life Support (ALS) with Ventilator",
                  "Hospital with ICU: Reserved at nearest Trauma ER",
                  "Traffic Condition: Light-to-Moderate (Speed: 52 km/h)",
                  "Unit Available: Driver Officer Vikram Singh on active standby",
                  "Estimated Arrival: 6 Minutes"
                ]).map((reason, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-300 space-y-1">
                <span className="font-bold block flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Provider-Independent Architecture</span>
                </span>
                <p className="text-slate-300 text-[10px] leading-relaxed">
                  Evaluates 108 Government, Private Hospital (Apollo, Fortis), Demo Fleets (Blinkit Ambulance) & Volunteer fleets seamlessly.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
