import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, AlertTriangle, CheckCircle2, Info, Zap } from 'lucide-react';

let _addToast = null;
export const toast = {
  critical: (msg) => _addToast?.({ type: 'critical', message: msg }),
  success: (msg) => _addToast?.({ type: 'success', message: msg }),
  info: (msg) => _addToast?.({ type: 'info', message: msg }),
  warning: (msg) => _addToast?.({ type: 'warning', message: msg }),
};

const TYPE_CONFIG = {
  critical: { icon: AlertTriangle, color: 'border-rose-500/60 bg-rose-950/90 text-rose-200', iconColor: 'text-rose-400', label: 'CRITICAL ALERT' },
  success: { icon: CheckCircle2, color: 'border-emerald-500/60 bg-emerald-950/90 text-emerald-200', iconColor: 'text-emerald-400', label: 'SUCCESS' },
  info: { icon: Info, color: 'border-cyan-500/60 bg-cyan-950/90 text-cyan-200', iconColor: 'text-cyan-400', label: 'INFO' },
  warning: { icon: Zap, color: 'border-amber-500/60 bg-amber-950/90 text-amber-200', iconColor: 'text-amber-400', label: 'WARNING' },
};

export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    _addToast = addToast;
    return () => { _addToast = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const cfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.info;
        const Icon = cfg.icon;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border ${cfg.color} backdrop-blur-xl shadow-xl w-80 transition-all duration-300`}
            style={{ animation: 'toast-in 0.3s ease' }}
          >
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.iconColor}`} />
            <div className="flex-1 min-w-0">
              <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.iconColor} block`}>{cfg.label}</span>
              <p className="text-xs leading-relaxed mt-0.5">{t.message}</p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="p-0.5 rounded hover:opacity-60 shrink-0 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
