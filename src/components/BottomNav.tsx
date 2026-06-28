'use client';

import React from 'react';
import { Dumbbell, Utensils, CalendarDays, Scale, Calendar } from 'lucide-react';

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
    { id: 'workout', label: '訓練', icon: Dumbbell },
    { id: 'diet', label: '飲食', icon: Utensils },
    { id: 'body', label: '磅重', icon: Scale },
    { id: 'stats', label: '統計', icon: CalendarDays },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-t border-zinc-900 pb-safe-bottom">
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
                <span className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-[2px]" />
              )}

              {/* Icon Container */}
              <div
                className={`relative p-1 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-blue-400 scale-110'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                
                {/* Active check-in countdown dot indicator inside Workout Tab */}
                {tab.id === 'workout' && isCheckedIn && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-blue-500"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                )}
              </div>

              {/* Text Label */}
              <span
                className={`text-[10px] mt-0.5 font-medium transition-all ${
                  isActive ? 'text-zinc-105 font-bold' : 'text-zinc-500'
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

