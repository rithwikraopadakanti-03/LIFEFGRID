import React, { useState, useEffect } from 'react';
import { HeartPulse, AlertTriangle, Activity, Pill, ShieldCheck, CheckCircle2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import axios from 'axios';

export default function PublicHealth() {
  const [metrics, setMetrics] = useState([]);
  const [analysis, setAnalysis] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const res = await axios.get('/api/health-metrics');
        setMetrics(res.data.metrics || []);
        setAnalysis(res.data.analysis || {});
      } catch (e) {
        console.error("Failed to load health metrics", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHealthData();
  }, []);

  const chartData = metrics.map(m => ({
    name: m.disease_name.split(' ')[0],
    ActiveCases: m.active_cases,
    NewCases24h: m.new_cases_24h,
    BedOccupancyPct: m.hospital_bed_occupancy_pct
  }));

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
              Epidemic Surveillance Engine
            </span>
            <span className="text-xs text-slate-400">Health Intelligence Agent Synced</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Public Health & Hospital Surge Dashboard</h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Real-time tracking of vector-borne & waterborne disease trends, ICU bed availability, medicine stockpile reserves, and automated surge allocation.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center shrink-0">
          <span className="text-xs font-semibold text-rose-300 block">Outbreak Risk Level</span>
          <span className="text-2xl font-black text-rose-400">{analysis.outbreak_risk_level || 'MODERATE'}</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Active Surveillance Cases</p>
            <h3 className="text-xl font-extrabold text-white">{analysis.active_surveillance_cases || 245}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Avg Hospital Occupancy</p>
            <h3 className="text-xl font-extrabold text-cyan-400">{analysis.avg_hospital_occupancy_pct || 63.8}%</h3>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Medicine Stock Reserve</p>
            <h3 className="text-xl font-extrabold text-emerald-400">{analysis.min_medicine_stock_pct || 88}%</h3>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Avg Recovery Rate</p>
            <h3 className="text-xl font-extrabold text-indigo-400">94.8%</h3>
          </div>
        </div>

      </div>

      {/* Main Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recharts Disease Bar Chart */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-100">Disease Trend & Hospital Occupancy Vector</h3>
            <span className="text-xs text-slate-400">Live Telemetry</span>
          </div>

          <div className="h-[320px] w-full pt-4 min-h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="ActiveCases" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Active Cases" />
                <Bar dataKey="NewCases24h" fill="#f59e0b" radius={[6, 6, 0, 0]} name="New Cases (24h)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: AI Medical Advice Cards */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AI Health Agent Directives</span>
          </h3>

          <div className="space-y-3">
            {metrics.map((m) => (
              <div key={m.id} className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-100">{m.disease_name}</h4>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-300">
                    {m.active_cases} Active
                  </span>
                </div>
                <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  ⚡ {m.ai_medical_advice}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Medicine Stock: <strong className="text-emerald-400">{m.medicine_stock_pct}%</strong></span>
                  <span>Bed Occ: <strong className="text-amber-400">{m.hospital_bed_occupancy_pct}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
