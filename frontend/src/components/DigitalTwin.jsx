import React, { useState, useEffect } from 'react';
import { Layers, Zap, Droplets, Users, Building2, School, ShieldAlert, Activity, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function DigitalTwin() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTwinData = async () => {
      try {
        const res = await axios.get('/api/digital-twin');
        setZones(res.data);
      } catch (e) {
        console.error("Failed to load Digital Twin zones", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTwinData();
  }, []);

  const defaultZones = [
    {
      id: 1,
      zone_code: "ZONE-01-CENTRAL",
      name: "Central Emergency & Metro Corridor",
      population: 145000,
      hospitals_count: 4,
      schools_count: 12,
      power_grid_status: "STABLE",
      water_supply_status: "NORMAL",
      overall_health_score: 92.4,
      risk_level: "LOW"
    },
    {
      id: 2,
      zone_code: "ZONE-02-NORTH",
      name: "North Riverbank & Coastal Basin",
      population: 120000,
      hospitals_count: 2,
      schools_count: 8,
      power_grid_status: "STABLE",
      water_supply_status: "MONITORED",
      overall_health_score: 88.0,
      risk_level: "MODERATE"
    },
    {
      id: 3,
      zone_code: "ZONE-03-SOUTH",
      name: "South Industrial & Expressway Hub",
      population: 90000,
      hospitals_count: 3,
      schools_count: 6,
      power_grid_status: "STABLE",
      water_supply_status: "NORMAL",
      overall_health_score: 94.5,
      risk_level: "LOW"
    }
  ];

  const displayZones = zones.length > 0 ? zones : defaultZones;
  const totalPop = displayZones.reduce((acc, z) => acc + (z.population || 0), 0);
  const avgHealth = (displayZones.reduce((acc, z) => acc + (z.overall_health_score || 90), 0) / displayZones.length).toFixed(1);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              Community Digital Twin v2.0
            </span>
            <span className="text-xs text-slate-400">Spatial Telemetry Mesh</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">District Digital Twin Engine</h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Real-time digital representation of infrastructure lifelines, population density, power sub-grids, water quality indices, and localized disaster exposure vectors.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center shrink-0">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Total Monitored Pop</span>
            <span className="text-xl font-extrabold text-white">{totalPop.toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Grid Health Index</span>
            <span className="text-xl font-extrabold text-emerald-400">{avgHealth}%</span>
          </div>
        </div>
      </div>

      {/* Digital Twin Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayZones.map((zone) => {
          const isHighRisk = zone.risk_level === 'HIGH';
          return (
            <div
              key={zone.id}
              className={`p-6 rounded-3xl border transition-all ${
                isHighRisk
                  ? 'glass-card-danger border-red-500/40 shadow-xl shadow-red-500/10'
                  : 'glass-panel border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 block mb-0.5">{zone.zone_code}</span>
                  <h3 className="font-extrabold text-base text-white">{zone.name}</h3>
                </div>

                <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full ${
                  isHighRisk ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                  zone.risk_level === 'MODERATE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  Risk: {zone.risk_level}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Population</span>
                  </div>
                  <span className="text-sm font-extrabold text-white">{zone.population.toLocaleString()}</span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hospitals</span>
                  </div>
                  <span className="text-sm font-extrabold text-white">{zone.hospitals_count} Units</span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <School className="w-3.5 h-3.5 text-purple-400" />
                    <span>Schools</span>
                  </div>
                  <span className="text-sm font-extrabold text-white">{zone.schools_count} Relief Points</span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Health Index</span>
                  </div>
                  <span className="text-sm font-extrabold text-cyan-400">{zone.overall_health_score}/100</span>
                </div>
              </div>

              {/* Grid & Water Status */}
              <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Power Grid Status
                  </span>
                  <span className={`font-bold ${
                    zone.power_grid_status === 'STABLE' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {zone.power_grid_status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Water Supply Status
                  </span>
                  <span className={`font-bold ${
                    zone.water_supply_status === 'NORMAL' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {zone.water_supply_status}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
