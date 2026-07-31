import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, ShieldCheck, User, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function LiveChatDrawer({ isOpen, onClose, incident, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    if (!incident) return;
    try {
      const res = await axios.get(`/api/incidents/${incident.id}/chat`);
      setMessages(res.data);
    } catch (e) {
      console.error("Failed to load chat messages", e);
    }
  };

  useEffect(() => {
    if (isOpen && incident) {
      fetchMessages();
      const interval = setInterval(() => {
        fetchMessages();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, incident]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !incident) return;

    const text = newMessage;
    setNewMessage('');
    setLoading(true);

    try {
      const senderName = currentUser?.full_name || (currentUser?.role === 'CITIZEN' ? 'Citizen' : 'Emergency Team Lead');
      const senderRole = currentUser?.team_department || (currentUser?.role === 'CITIZEN' ? 'Citizen' : 'Responder');

      const res = await axios.post(`/api/incidents/${incident.id}/chat`, {
        message: text,
        sender_name: senderName,
        sender_role: senderRole
      });

      setMessages(prev => [...prev, res.data]);
    } catch (err) {
      console.error("Failed to send chat message", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !incident) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md glass-panel border-l border-cyan-500/40 shadow-2xl flex flex-col backdrop-blur-xl">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">Live Crew Chat</h3>
            <p className="text-xs text-slate-400">Incident #{incident.id} • {incident.title}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender_role === 'Citizen' || msg.sender_name === currentUser?.full_name;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-mono">
                <span>{msg.sender_name} ({msg.sender_role})</span>
                <span>•</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div
                className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed font-medium ${
                  isUser
                    ? 'bg-cyan-600/30 text-cyan-100 border border-cyan-500/40 rounded-tr-none'
                    : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-none'
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type message to emergency crew..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-600/30"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
