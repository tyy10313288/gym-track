'use client';

import React from 'react';
import { Flame, Calendar, ClipboardList, Settings } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isCheckedIn: boolean;
  timeLeft: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  setTab,
  isCheckedIn,
  timeLeft,
}) => {
  const tabs = [
    { id: 'dashboard', label: '首頁打卡', icon: Flame },
    { id: 'planner', label: '每週課表', icon: Calendar },
    { id: 'logger', label: '極簡紀錄', icon: ClipboardList },
    { id: 'settings', label: '同步設定', icon: Settings },
  ];

  // Format time left for quick HUD indicator on navigation
  const formatTimeHUD = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-t border-zinc-800/80 pb-safe-bottom">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className="relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Active Glow Accent */}
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full blur-[2px]" />
              )}

              {/* Icon Container */}
              <div
                className={`relative p-1 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-amber-500 scale-110'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="w-6 h-6" />
                
                {/* Active check-in countdown dot indicator inside Tab */}
                {tab.id === 'dashboard' && isCheckedIn && (
                  <span className={`absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5`}>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${timeLeft <= 300 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${timeLeft <= 300 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                  </span>
                )}
              </div>

              {/* Text Label */}
              <span
                className={`text-[10px] mt-0.5 font-medium transition-all ${
                  isActive ? 'text-zinc-100 font-semibold' : 'text-zinc-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
