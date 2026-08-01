import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import CitizenPortal from './components/CitizenPortal';
import TeamCommandCenter from './components/TeamCommandCenter';
import CommandCenter from './components/CommandCenter';
import AgentMatrix from './components/AgentMatrix';
import VoiceAiModal from './components/VoiceAiModal';
import IncidentReportModal from './components/IncidentReportModal';
import LiveChatDrawer from './components/LiveChatDrawer';
import DigitalTwin from './components/DigitalTwin';
import PublicHealth from './components/PublicHealth';
import WeatherIntel from './components/WeatherIntel';
import EmergencyTimeline from './components/EmergencyTimeline';
import Analytics from './components/Analytics';

export default function App() {
  const [activeTab, setActiveTab] = useState('citizen-portal');
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  // User State initialized from localStorage (No auto-demo login on deploy)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("lifegrid_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedIncidentForVoice, setSelectedIncidentForVoice] = useState(null);

  // Live Chat Drawer
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [selectedIncidentForChat, setSelectedIncidentForChat] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incRes, resRes, anaRes] = await Promise.all([
        axios.get('/api/incidents'),
        axios.get('/api/resources'),
        axios.get('/api/analytics')
      ]);
      setIncidents(incRes.data);
      setResources(resRes.data);
      setAnalytics(anaRes.data);
    } catch (e) {
      console.error("Failed to load platform data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("lifegrid_user", JSON.stringify(user));
    } catch (e) {}
    if (user.role === 'EMERGENCY_TEAM') {
      setActiveTab('team-ops');
    } else {
      setActiveTab('citizen-portal');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("lifegrid_user");
    } catch (e) {}
  };

  const handleIncidentCreated = (newInc) => {
    setIncidents(prev => [newInc, ...prev]);
    fetchData();
  };

  const handleOpenVoiceModal = (inc = null) => {
    setSelectedIncidentForVoice(inc);
    setIsVoiceModalOpen(true);
  };

  const handleOpenChatDrawer = (inc) => {
    setSelectedIncidentForChat(inc);
    setIsChatDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenVoiceModal={() => handleOpenVoiceModal(null)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onRefreshData={fetchData}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {loading && incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-cyan-400 font-mono">Initializing LifeGrid AI Operating System...</p>
          </div>
        ) : (
          <>
            {activeTab === 'citizen-portal' && (
              <CitizenPortal
                currentUser={currentUser}
                incidents={incidents}
                resources={resources}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onOpenVoiceModal={handleOpenVoiceModal}
                onOpenChatDrawer={handleOpenChatDrawer}
              />
            )}

            {activeTab === 'team-ops' && (
              <TeamCommandCenter
                currentUser={currentUser}
                incidents={incidents}
                onSelectIncident={(inc) => console.log('Selected', inc)}
                onOpenChatDrawer={handleOpenChatDrawer}
                onOpenVoiceModal={handleOpenVoiceModal}
                onRefreshData={fetchData}
              />
            )}

            {activeTab === 'command' && (
              <CommandCenter
                incidents={incidents}
                resources={resources}
                analytics={analytics}
                onSelectIncident={(inc) => console.log('Selected', inc)}
                onOpenVoiceModal={handleOpenVoiceModal}
                onOpenReportModal={() => setIsReportModalOpen(true)}
              />
            )}

            {activeTab === 'agents' && <AgentMatrix />}

            {activeTab === 'voice' && (
              <div className="py-10 text-center space-y-4 glass-panel rounded-3xl p-8 border border-slate-800">
                <h2 className="text-2xl font-extrabold text-white">Voice AI Interactive Call Simulator</h2>
                <p className="text-sm text-slate-300 max-w-lg mx-auto">
                  Test spoken multi-lingual (EN, HI, TE, TA, KN) emergency call handling and casualty parsing.
                </p>
                <button
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 cursor-pointer"
                >
                  Launch Interactive Call Simulation
                </button>
              </div>
            )}

            {activeTab === 'digital-twin' && <DigitalTwin />}

            {activeTab === 'health' && <PublicHealth />}

            {activeTab === 'weather' && <WeatherIntel />}

            {activeTab === 'timeline' && <EmergencyTimeline incidents={incidents} />}

            {activeTab === 'analytics' && <Analytics />}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-900 px-6 py-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LifeGrid AI © 2026 • Autonomous Community Intelligence & Emergency Response OS</span>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>JWT Auth: Active</span>
            <span>Gemini LLM: Online</span>
            <span>Multi-Department Sync: OK</span>
          </div>
        </div>
      </footer>

      {/* Modals & Slide-over Drawers */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onIncidentCreated={handleIncidentCreated}
      />

      <VoiceAiModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        targetIncident={selectedIncidentForVoice}
      />

      <LiveChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        incident={selectedIncidentForChat}
        currentUser={currentUser}
      />

    </div>
  );
}
