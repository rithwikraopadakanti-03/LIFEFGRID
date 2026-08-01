import React, { useState, useEffect } from 'react';
import { X, Upload, Mic, MapPin, AlertTriangle, ShieldCheck, CheckCircle2, Sparkles, Navigation, Locate } from 'lucide-react';
import axios from 'axios';

export default function IncidentReportModal({ isOpen, onClose, onIncidentCreated }) {
  const [category, setCategory] = useState('Flood');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('HIGH');
  const [latitude, setLatitude] = useState(16.5095);
  const [longitude, setLongitude] = useState(80.6455);
  const [address, setAddress] = useState('Detecting GPS location...');
  const [detectingGps, setDetectingGps] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=800&auto=format&fit=crop');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Auto detect location when modal opens
  useEffect(() => {
    if (isOpen) {
      detectUserLocation();
    }
  }, [isOpen]);

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      setAddress("Geolocation not supported by browser. Using default city coords.");
      return;
    }

    setDetectingGps(true);
    setAddress("Detecting high-precision GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);

        // Reverse Geocoding via OpenStreetMap Nominatim
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`GPS Locked: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`);
          }
        } catch (e) {
          setAddress(`GPS Locked: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`);
        } finally {
          setDetectingGps(false);
        }
      },
      (error) => {
        console.warn("GPS detection error:", error);
        setAddress("Location permission denied. Using Sector 2 Metro Coordinates.");
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  if (!isOpen) return null;

  const categories = [
    'Flood', 'Fire', 'Accident', 'Medical Emergency', 
    'Building Collapse', 'Gas Leak', 'Power Failure', 'Water Issue'
  ];

  const handleRecordVoice = () => {
    if (isRecording) {
      // Stop recording
      if (window._lifegridRecognition) {
        window._lifegridRecognition.stop();
        window._lifegridRecognition = null;
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    window._lifegridRecognition = recognition;
    setIsRecording(true);
    setVoiceTranscript('');

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim = transcript;
        }
      }
      setVoiceTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permission in your browser settings.');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      window._lifegridRecognition = null;
    };

    recognition.start();
  };

  const handleVerifyFirst = async () => {
    if (!title || !description) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/incidents/verify', {
        title,
        category,
        description,
        photo_url: photoUrl,
        voice_transcript: voiceTranscript,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });
      setVerificationResult(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!title || !description) return;

    setLoading(true);
    try {
      const res = await axios.post('/api/incidents', {
        title,
        category,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address,
        urgency,
        photo_url: photoUrl,
        voice_transcript: voiceTranscript,
        reporter_name: "Citizen Reporter",
        reporter_phone: "+91 98765 43210"
      });

      if (onIncidentCreated) {
        onIncidentCreated(res.data);
      }
      onClose();
    } catch (err) {
      console.error("Failed to submit incident", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl glass-panel rounded-3xl border border-red-500/30 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Live Citizen Incident Report</h3>
              <p className="text-xs text-slate-400">Autonomous AI Verification & Dispatch System</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
          
          {/* Automatic Location Detector Banner */}
          <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-cyan-500/30 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Locate className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
                {detectingGps ? 'Detecting Live GPS...' : 'Auto-Detected GPS Location'}
              </span>
              <p className="text-xs text-slate-200 font-medium line-clamp-1">{address}</p>
            </div>

            <button
              type="button"
              onClick={detectUserLocation}
              className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 cursor-pointer shrink-0"
            >
              Re-Detect GPS
            </button>
          </div>

          {/* Category Select Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Incident Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-md shadow-red-500/10'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Incident Headline
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Severe Flash Flood Inundation"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Urgency Level
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Detailed Situation & Hazard Description
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe situation, stranded people count, road blockages..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-red-500"
            />
          </div>

          {/* GPS Coordinates & Photo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Latitude & Longitude
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-1/2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-1/2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Photo Upload / Attachment
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPhotoUrl(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30"
              />
            </div>
          </div>

          {/* Voice Recording Simulation */}
          <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-200">Voice Note Attachment</span>
              <p className="text-[11px] text-slate-400">
                {voiceTranscript ? `"${voiceTranscript}"` : 'No voice recording recorded yet.'}
              </p>
            </div>
            
            <button
              type="button"
              onClick={handleRecordVoice}
              className={`px-3 py-2 rounded-xl ${isRecording ? 'bg-red-600/30 border-red-500/60' : 'bg-indigo-600/20 border-indigo-500/40'} hover:bg-indigo-600/30 text-indigo-300 border text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer`}
            >
              <Mic className={`w-3.5 h-3.5 ${isRecording ? 'animate-bounce text-red-400' : ''}`} />
              <span>{isRecording ? '⏹ Stop Recording' : '🎙 Record Voice'}</span>
            </button>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleVerifyFirst}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 cursor-pointer"
            >
              AI Pre-Verify
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 cursor-pointer"
            >
              {loading ? 'Submitting & Dispatching...' : 'Verify & Broadcast Incident'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
