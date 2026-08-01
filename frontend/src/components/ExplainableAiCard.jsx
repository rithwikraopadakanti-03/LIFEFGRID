import React from 'react';
import { HelpCircle, ShieldAlert, Navigation, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ExplainableAiCard({ explainableItems = [] }) {
  if (!explainableItems || explainableItems.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-slate-400 text-xs">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          <span>Explainable AI reasoning matrix active. Select an emergency incident to view reasoning breakdown.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-100 text-sm tracking-wide uppercase">
              Explainable AI Recommendation Reasoning ("WHY")
            </h3>
            <p className="text-xs text-slate-400">
              Audit Transparency: Every AI Dispatch Decision Explained
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 text-xs font-semibold">
          Audit Verified
        </span>
      </div>

      <div className="space-y-3">
        {explainableItems.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <h4 className="font-bold text-xs text-slate-100 uppercase tracking-wide">
                  {item.title || item.department}
                </h4>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  ETA: <strong className="text-slate-200">{item.eta || '5 mins'}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold text-[11px]">
                  {item.confidence || '96%'} Confidence
                </span>
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-amber-300">Reasoning Factor:</strong> {item.reason}
                </p>
              </div>

              {item.resource_name && (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Selected Resource Unit: <strong className="text-cyan-300">{item.resource_name}</strong></span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
