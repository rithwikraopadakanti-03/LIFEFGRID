import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, CloudRain, Sun, ShieldAlert, Zap } from 'lucide-react';
import axios from 'axios';

export default function PredictiveAiSimulator() {
  const [rainIncrease, setRainIncrease] = useState(60);
  const [tempSpike, setTempSpike] = useState(6);
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/predictive/simulation', null, {
        params: {
          rainfall_increase_mm: rainIncrease,
          temperature_spike_c: tempSpike
        }
      });
      setSimulationResult(res.data);
    } catch (e) {
      console.error("Simulation failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-100 text-sm tracking-wide uppercase">
              Predictive AI Early Warning & Hazard Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Proactive Disaster Mitigation Before Incidents Occur
            </p>
          </div>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/30 hover:scale-105 transition-all disabled:opacity-50"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>{loading ? 'Simulating...' : 'Run Predictive Simulation'}</span>
        </button>
      </div>

      {/* Control Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <CloudRain className="w-4 h-4" /> Rainfall Telemetry Increase
            </span>
            <span className="font-mono text-cyan-300">+{rainIncrease} mm/24h</span>
          </div>
          <input
            type="range"
            min="10"
            max="150"
            value={rainIncrease}
            onChange={(e) => setRainIncrease(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Sun className="w-4 h-4" /> Heatwave Temperature Spike
            </span>
            <span className="font-mono text-amber-300">+{tempSpike} °C</span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            value={tempSpike}
            onChange={(e) => setTempSpike(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>

      {/* Simulation Predictions */}
      {simulationResult && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
            AI Predicted Hazards & Recommended Pre-Evacuations:
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {simulationResult.predictions.map((pred, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-slate-100">{pred.hazard_type}</h5>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-400 font-extrabold text-xs">
                    {pred.probability_pct}% Probability
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  <span>Impacted Areas: </span>
                  <strong className="text-slate-200">{pred.impacted_zones.join(', ')}</strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-amber-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>{pred.recommended_preemptive_action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
