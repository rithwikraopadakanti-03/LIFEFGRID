import React, { useState, useEffect } from 'react';
import { CloudRain, Wind, Thermometer, Droplets, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import axios from 'axios';

export default function WeatherIntel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const res = await axios.get('/api/weather');
        setData(res.data);
      } catch (e) {
        console.error("Failed to load weather data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchWeatherData();
  }, []);

  const metric = data?.metric || {};
  const analysis = data?.analysis || {};

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-blue-500/40 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Weather Intelligence Agent
            </span>
            <span className="text-xs text-slate-400">OpenWeather API & Atmospheric Doppler Sync</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Atmospheric & Hydro-Meteorological Radar</h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            {metric.forecast_summary || "Heavy downpour associated with coastal depression. Flash flood warning active for low-lying sectors."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-center shrink-0">
          <span className="text-xs font-semibold text-blue-300 block">Storm Alert Status</span>
          <span className="text-2xl font-black text-amber-400">{metric.storm_alert_level || 'SEVERE'}</span>
        </div>
      </div>

      {/* Main Meteorological Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Flash Flood Meter Card */}
        <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase text-slate-400">Flash Flood Probability</span>
            <CloudRain className="w-6 h-6 text-blue-400" />
          </div>
          <div className="space-y-2 my-2">
            <h3 className="text-3xl font-black text-blue-400">{analysis.flood_probability_pct || 82.5}%</h3>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${analysis.flood_probability_pct || 82}%` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-slate-400">Based on 24h rainfall rate & soil saturation index.</p>
        </div>

        {/* Rainfall Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase text-slate-400">Rainfall (24 Hours)</span>
            <Droplets className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="my-2">
            <h3 className="text-3xl font-black text-white">{metric.rainfall_mm || 78.5} <span className="text-sm font-normal text-slate-400">mm</span></h3>
          </div>
          <p className="text-xs text-slate-400">Precipitation rate threshold exceeded by 42%.</p>
        </div>

        {/* Temperature & Heat Index */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase text-slate-400">Temperature & Heat Index</span>
            <Thermometer className="w-6 h-6 text-amber-400" />
          </div>
          <div className="my-2 space-y-1">
            <h3 className="text-3xl font-black text-white">{metric.temperature_c || 31.5}°C</h3>
            <p className="text-xs text-amber-400 font-semibold">Heat Index Feels Like: {metric.heat_index_c || 38.2}°C</p>
          </div>
          <p className="text-xs text-slate-400">Humidity at {metric.humidity_pct || 89}%.</p>
        </div>

        {/* Wind Vector */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase text-slate-400">Wind Velocity Vector</span>
            <Wind className="w-6 h-6 text-teal-400" />
          </div>
          <div className="my-2">
            <h3 className="text-3xl font-black text-white">{metric.wind_speed_kmh || 42} <span className="text-sm font-normal text-slate-400">km/h</span></h3>
          </div>
          <p className="text-xs text-slate-400 font-medium">Gust vectors heading ENE towards river basin.</p>
        </div>

      </div>

      {/* Weather Agent Recommendations */}
      {analysis.recommendations && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Weather Intelligence Agent Automated Directives</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {analysis.recommendations.map((rec, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold shrink-0">{idx+1}</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
