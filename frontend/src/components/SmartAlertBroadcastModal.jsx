import React, { useState } from 'react';
import { Radio, X, Send, CheckCircle2, ShieldAlert, Smartphone, Mail, Phone, Bell } from 'lucide-react';
import axios from 'axios';

export default function SmartAlertBroadcastModal({ isOpen, onClose }) {
  const [targetGroup, setTargetGroup] = useState('ALL_CITIZENS');
  const [title, setTitle] = useState('FLASH FLOOD PRE-EVACUATION WARNING');
  const [message, setMessage] = useState('LifeGrid Command Center: Low-lying areas in Sector 4 must prepare for immediate evacuation. Move to designated high ground shelters.');
  const [channels, setChannels] = useState(['PUSH', 'SMS', 'EMAIL', 'VOICE']);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(null);

  if (!isOpen) return null;

  const toggleChannel = (ch) => {
    if (channels.includes(ch)) {
      setChannels(channels.filter(c => c !== ch));
    } else {
      setChannels([...channels, ch]);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await axios.post('/api/alerts/broadcast', {
        target_group: targetGroup,
        title,
        message,
        channels,
        urgency: 'CRITICAL'
      });
      setSentSuccess(res.data);
      setTimeout(() => {
        setSentSuccess(null);
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Alert broadcast failed", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-700/50 text-rose-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Smart Emergency Alert Broadcast</h3>
              <p className="text-xs text-slate-400">Multi-Channel Public Safety Dispatcher</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="p-6 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="font-extrabold text-emerald-300 text-base">Broadcast Successfully Dispatched!</h4>
            <p className="text-xs text-emerald-400">{sentSuccess.message}</p>
          </div>
        ) : (
          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Target Recipient Audience</label>
              <select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
              >
                <option value="ALL_CITIZENS">All District Citizens (Sector 1-12)</option>
                <option value="POLICE">Police Dispatch Units</option>
                <option value="FIRE">Fire & Rescue Tenders</option>
                <option value="HOSPITALS">Hospital ER Trauma Wards</option>
                <option value="MUNICIPALITY">Municipality & Disaster Response</option>
                <option value="VOLUNTEERS">Community Volunteers</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Alert Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Emergency Message Body</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Dispatch Channels</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'PUSH', label: 'Push Notification', icon: Bell },
                  { id: 'SMS', label: 'Cellular SMS', icon: Smartphone },
                  { id: 'EMAIL', label: 'Email Broadcast', icon: Mail },
                  { id: 'VOICE', label: 'Twilio & Omni Voice Call', icon: Phone }
                ].map((ch) => {
                  const Icon = ch.icon;
                  const selected = channels.includes(ch.id);
                  return (
                    <button
                      type="button"
                      key={ch.id}
                      onClick={() => toggleChannel(ch.id)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                        selected ? 'bg-indigo-950 border-indigo-600 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4 fill-white" />
              <span>{sending ? 'Dispatching Broadcast...' : 'Issue Multi-Channel Emergency Alert'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
