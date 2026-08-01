import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Film, MapPin, ShieldCheck, Truck, CheckCircle2 } from 'lucide-react';

export default function IncidentReplayPlayer({ replayData, onFrameChange }) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const frames = replayData?.replay_frames || [];

  useEffect(() => {
    let timer;
    if (isPlaying && frames.length > 0) {
      timer = setInterval(() => {
        setCurrentFrameIndex((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          if (onFrameChange) onFrameChange(frames[next]);
          return next;
        });
      }, 2500 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, frames, playbackSpeed, onFrameChange]);

  if (!frames || frames.length === 0) return null;

  const currentFrame = frames[currentFrameIndex];

  return (
    <div className="rounded-2xl border border-indigo-800/80 bg-slate-950/95 backdrop-blur-xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-400">
            <Film className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-100 text-sm tracking-wide uppercase">
              Incident Temporal Replay Mode
            </h3>
            <p className="text-xs text-slate-400">
              Interactive 00:00 to Resolution Playback & Map Route Vectors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlaybackSpeed(s => s === 1 ? 2 : s === 2 ? 4 : 1)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold hover:border-indigo-500"
          >
            {playbackSpeed}x Speed
          </button>
          <button
            onClick={() => {
              setCurrentFrameIndex(0);
              setIsPlaying(true);
              if (onFrameChange) onFrameChange(frames[0]);
            }}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isPlaying ? 'Pause Replay' : 'Play Replay'}</span>
          </button>
        </div>
      </div>

      {/* Frame Details */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-lg bg-indigo-950 border border-indigo-700 font-mono text-indigo-300 font-extrabold text-sm">
            {currentFrame.timestamp}
          </span>
          <div>
            <h4 className="font-extrabold text-sm text-slate-100">{currentFrame.title}</h4>
            <p className="text-xs text-slate-400 mt-0.5">{currentFrame.description}</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 font-semibold text-xs text-amber-400">
          Step {currentFrame.step} of {frames.length}
        </span>
      </div>

      {/* Scrub Bar */}
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max={frames.length - 1}
          value={currentFrameIndex}
          onChange={(e) => {
            const idx = parseInt(e.target.value);
            setCurrentFrameIndex(idx);
            if (onFrameChange) onFrameChange(frames[idx]);
          }}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
          {frames.map((f, i) => (
            <span
              key={i}
              onClick={() => {
                setCurrentFrameIndex(i);
                if (onFrameChange) onFrameChange(frames[i]);
              }}
              className={`cursor-pointer hover:text-indigo-400 transition-all ${
                i === currentFrameIndex ? 'text-indigo-400 font-bold underline' : ''
              }`}
            >
              {f.timestamp}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
