import React from 'react';
import { 
  ShieldAlert, Activity, Cpu, MapPin, PhoneCall, 
  BarChart3, CloudRain, HeartPulse, Layers, History, PlusCircle, RefreshCw, User, LogIn, LogOut
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentUser,
  onOpenReportModal, 
  onOpenVoiceModal, 
  onOpenAuthModal,
  onLogout,
  onRefreshData 
}) {
  const tabs = [
    { id: 'citizen-portal', label: 'Citizen Portal', icon: User },
    { id: 'team-ops', label: 'Emergency Team Ops', icon: ShieldAlert },
    { id: 'command', label: 'Command Center', icon: Activity },
    { id: 'agents', label: 'Multi-Agent Matrix', icon: Cpu },
    { id: 'voice', label: 'Voice Dispatcher', icon: PhoneCall },
    { id: 'digital-twin', label: 'Digital Twin', icon: Layers },
    { id: 'health', label: 'Public Health', icon: HeartPulse },
    { id: 'weather', label: 'Weather Telemetry', icon: CloudRain },
    { id: 'timeline', label: 'Audit Timeline', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 border-b border-slate-800 px-4 lg:px-8 py-3 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-700/60 text-rose-400 shadow-md">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-xl text-slate-100 tracking-tight">
                LIFEGRID <span className="text-rose-500">EOC</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase rounded bg-slate-800 text-slate-300 border border-slate-700">
                National Ops
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Unified Emergency Response Operating System</p>
          </div>
        </div>

        {/* Action Buttons & Auth Status */}
        <div className="flex items-center gap-2">
          
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
              <div className="flex flex-col text-left">
                <span className="font-bold text-slate-100 leading-tight">{currentUser.full_name}</span>
                <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wide">
                  {currentUser.role === 'CITIZEN' ? 'Citizen' : `${currentUser.team_department} Department`}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer ml-1 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 text-xs font-bold cursor-pointer transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Portal Sign In</span>
            </button>
          )}

          <button
            onClick={onRefreshData}
            title="Refresh Operations Data"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenVoiceModal}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-800/60 font-bold text-xs transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-amber-400" />
            <span>Voice Dispatcher</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-600/20 border border-rose-500 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Hazard</span>
          </button>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-100' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
