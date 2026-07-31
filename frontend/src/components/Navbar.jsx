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
    { id: 'agents', label: 'AI Agent Matrix', icon: Cpu },
    { id: 'voice', label: 'Voice AI Simulator', icon: PhoneCall },
    { id: 'digital-twin', label: 'Digital Twin', icon: Layers },
    { id: 'health', label: 'Public Health', icon: HeartPulse },
    { id: 'weather', label: 'Weather Intel', icon: CloudRain },
    { id: 'timeline', label: 'Timeline & Audit', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent tracking-tight">
                LIFEGRID AI
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                v2.5 OS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">One Platform. One Community. Faster Response. More Lives Saved.</p>
          </div>
        </div>

        {/* Action Buttons & Auth Status */}
        <div className="flex items-center gap-2">
          
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <div className="flex flex-col text-left">
                <span className="font-bold text-white leading-tight">{currentUser.full_name}</span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {currentUser.role === 'CITIZEN' ? 'Citizen' : `${currentUser.team_department} Team`}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                className="p-1 text-slate-400 hover:text-red-400 cursor-pointer ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              <span>Portal Login</span>
            </button>
          )}

          <button
            onClick={onRefreshData}
            title="Refresh AI Data"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenVoiceModal}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-medium text-xs transition-all cursor-pointer shadow-sm"
          >
            <PhoneCall className="w-4 h-4 text-indigo-400 animate-bounce" />
            <span>Voice AI</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs transition-all shadow-lg shadow-red-600/30 border border-red-400/40 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Emergency</span>
          </button>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
