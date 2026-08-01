import React from 'react';
import { User, Shield, Mail, Phone, MapPin, Building2, AlertTriangle, X, CheckCircle, Lock } from 'lucide-react';

export default function UserProfileModal({ isOpen, onClose, currentUser, onLogout }) {
  if (!isOpen || !currentUser) return null;

  const isCitizen = currentUser.role === 'CITIZEN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-cyan-500/40 bg-slate-950 p-6 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              <User className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 block">
                User Details & Credentials
              </span>
              <h3 className="text-lg font-black text-white">{currentUser.full_name || 'User Profile'}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Details Grid */}
        <div className="space-y-3 text-xs">
          
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-semibold">Account Role:</span>
            </div>
            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
              isCitizen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}>
              {isCitizen ? 'Citizen User' : `${currentUser.team_department || 'Emergency'} Command Officer`}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-semibold">Email:</span>
            </div>
            <span className="font-mono text-slate-100 font-bold">{currentUser.email || 'N/A'}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-semibold">Phone:</span>
            </div>
            <span className="font-mono text-slate-100 font-bold">{currentUser.phone || '+91 8121985059'}</span>
          </div>

          {!isCitizen && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold">Department HQ:</span>
              </div>
              <span className="font-bold text-amber-300">{currentUser.team_department || 'EOC Ops'} Station</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-slate-300 mb-1">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-semibold">Registered Location / Address:</span>
            </div>
            <p className="text-slate-200 font-mono text-[11px] leading-relaxed pl-6">
              {currentUser.address || 'Krishna River Basin Metro Zone, Ward 11'}
            </p>
          </div>

          {/* Emergency Contacts if Citizen */}
          {isCitizen && currentUser.emergency_contacts && currentUser.emergency_contacts.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-300 block mb-1">Registered Emergency Contact:</span>
              {currentUser.emergency_contacts.map((c, i) => (
                <div key={i} className="text-[11px] font-mono text-emerald-300 pl-2 border-l-2 border-emerald-500">
                  {c.name} ({c.relation}) — {c.phone}
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 text-cyan-300">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>JWT Authentication Status:</span>
            </div>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              Verified & Active
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <span>Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
