'use client';

import React, { useEffect, useState } from 'react';
import { X, Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';

interface RestTimerProps {
  durationSeconds: number; // default 60
  onClose: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  durationSeconds,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [isActive, setIsActive] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && !isCompleted) {
      setIsCompleted(true);
      setIsActive(false);
      // Trigger subtle device haptic simulation (e.g. flash screen / play simple beep)
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, isCompleted]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setSecondsLeft(durationSeconds);
    setIsActive(true);
    setIsCompleted(false);
  };

  const addTime = () => {
    setSecondsLeft((prev) => prev + 10);
    if (isCompleted) {
      setIsCompleted(false);
      setIsActive(true);
    }
  };

  const subTime = () => {
    setSecondsLeft((prev) => Math.max(0, prev - 10));
  };

  const progress = (secondsLeft / durationSeconds) * 100;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto">
      <div
        className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 shadow-2xl p-4 flex items-center justify-between ${
          isCompleted
            ? 'bg-rose-950/90 border-rose-500 animate-pulse text-rose-100'
            : 'bg-zinc-900/90 border-zinc-800 text-zinc-100'
        }`}
      >
        {/* Background progress indicator */}
        <div
          className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${
            isCompleted ? 'bg-rose-500' : 'bg-amber-500'
          }`}
          style={{ width: `${isCompleted ? 100 : progress}%` }}
        />

        <div className="flex items-center space-x-3.5">
          {/* Time text / Icon */}
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 font-medium">
              {isCompleted ? '休息結束！' : '組間休息中'}
            </span>
            <span
              className={`text-2xl font-black tracking-wider tabular-nums ${
                isCompleted ? 'text-rose-400' : 'text-amber-400'
              }`}
            >
              {secondsLeft}s
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Adjustments */}
          <button
            onClick={subTime}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 rounded-lg transition"
            title="-10秒"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <button
            onClick={addTime}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 rounded-lg transition"
            title="+10秒"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Pause / Play */}
          {!isCompleted && (
            <button
              onClick={toggleTimer}
              className={`p-2 rounded-lg transition active:scale-95 ${
                isActive
                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}

          {/* Restart if finished */}
          {isCompleted && (
            <button
              onClick={resetTimer}
              className="p-2 bg-rose-500 text-white hover:bg-rose-600 active:scale-95 rounded-lg transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Dismiss button */}
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 active:scale-95 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
