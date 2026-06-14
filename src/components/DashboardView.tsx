'use client';

import React from 'react';
import { Play, LogOut, Flame, Sparkles, ArrowRight, CalendarRange, Clock } from 'lucide-react';
import { CheckInStatus, WorkoutTemplate, WeeklySchedule } from '../types/gym';

interface DashboardViewProps {
  checkInStatus: CheckInStatus;
  onCheckIn: (duration: number) => void;
  onCheckOut: () => void;
  timeLeft: number;
  todayTemplate: WorkoutTemplate | null;
  setTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  checkInStatus,
  onCheckIn,
  onCheckOut,
  timeLeft,
  todayTemplate,
  setTab,
}) => {
  const [selectedDuration, setSelectedDuration] = React.useState<number>(40);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isWarnState = timeLeft <= 300; // 5 minutes or less

  // Date Formatting for Greeting
  const getTodayString = () => {
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const now = new Date();
    const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;
    const dayStr = days[now.getDay()];
    return { dateStr, dayStr };
  };

  const { dateStr, dayStr } = getTodayString();

  return (
    <div className="flex flex-col min-h-full pb-24 text-zinc-100">
      {/* Top Welcome Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs text-zinc-400 font-medium tracking-wide block">
            {dateStr} • {dayStr}
          </span>
          <h1 className="text-2xl font-black tracking-tight text-zinc-100 flex items-center space-x-1.5 mt-0.5">
            <span>你好，訓練者</span>
            <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400/20" />
          </h1>
        </div>
      </div>

      {/* Main Check-In Circle Dial */}
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        {!checkInStatus.isCheckedIn ? (
          <div className="w-full max-w-xs flex flex-col items-center">
            {/* Session Selector */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 flex w-full max-w-xs mb-8">
              <button
                type="button"
                onClick={() => setSelectedDuration(40)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                  selectedDuration === 40
                    ? 'bg-amber-500 text-zinc-950 shadow-lg'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                1 節 (40 分鐘)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDuration(80)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                  selectedDuration === 80
                    ? 'bg-amber-500 text-zinc-950 shadow-lg'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                2 節 (80 分鐘)
              </button>
            </div>

            {/* Check-In Dial */}
            <button
              onClick={() => onCheckIn(selectedDuration)}
              className="relative w-56 h-56 rounded-full bg-zinc-900/60 border-2 border-zinc-800 hover:border-amber-500/40 flex flex-col items-center justify-center transition-all duration-300 group shadow-xl active:scale-95 cursor-pointer"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Outer Glow Ring */}
              <div className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-amber-500/10 to-rose-500/10 opacity-60 group-hover:opacity-100 transition-opacity blur-[4px]" />
              
              <Flame className="w-12 h-12 text-amber-500 mb-2 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-lg font-black tracking-widest text-zinc-200 group-hover:text-amber-400 transition-colors">
                一鍵入館
              </span>
              <span className="text-[10px] text-zinc-500 font-medium mt-1">
                開始 {selectedDuration} 分鐘倒數
              </span>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-xs flex flex-col items-center">
            {/* Active Timer Dial */}
            <div
              className={`relative w-56 h-56 rounded-full bg-zinc-900/80 border-2 flex flex-col items-center justify-center transition-all duration-500 shadow-2xl ${
                isWarnState
                  ? 'border-rose-500/80 shadow-rose-950/20 bg-rose-950/10'
                  : 'border-amber-500/80 shadow-amber-950/20 bg-amber-950/5'
              }`}
            >
              {/* Pulsing ring indicator */}
              <div className={`absolute inset-0 rounded-full animate-ping opacity-10 ${
                isWarnState ? 'bg-rose-500' : 'bg-amber-500'
              }`} />

              <span className={`text-[10px] uppercase font-bold tracking-wider ${
                isWarnState ? 'text-rose-400 animate-pulse' : 'text-amber-400'
              }`}>
                {isWarnState ? '時間即將結束！' : '健身中倒數'}
              </span>

              <span
                className={`text-4xl font-black tracking-tight font-mono my-2.5 tabular-nums select-none ${
                  isWarnState ? 'text-rose-500 animate-pulse' : 'text-zinc-100'
                }`}
              >
                {formatTime(timeLeft)}
              </span>

              {/* Time progress description */}
              <div className="flex items-center text-[10px] text-zinc-400 space-x-1">
                <Clock className="w-3 h-3" />
                <span>限時 {checkInStatus.durationMinutes} 分鐘</span>
              </div>
            </div>

            {/* Check-Out early button */}
            <button
              onClick={onCheckOut}
              className="mt-8 flex items-center space-x-1.5 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold rounded-xl text-xs active:scale-95 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>提前出館</span>
            </button>
          </div>
        )}
      </div>

      {/* Today's Workout Summary Card */}
      <div className="mt-auto">
        <h2 className="text-xs text-zinc-500 font-bold tracking-wider mb-2.5 flex items-center space-x-1.5">
          <CalendarRange className="w-3.5 h-3.5" />
          <span>今日預定課表</span>
        </h2>

        {todayTemplate ? (
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4.5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                  {todayTemplate.name.split('：')[0]}
                </span>
                <h3 className="font-extrabold text-base text-zinc-100 mt-1">
                  {todayTemplate.name.split('：')[1]}
                </h3>
              </div>
            </div>
            
            <p className="text-xs text-zinc-400 mb-4 line-clamp-1">
              {todayTemplate.description}
            </p>

            {/* Exercises mini preview */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {todayTemplate.exercises.map((ex, index) => (
                <span
                  key={ex.exerciseId + index}
                  className="text-[10px] bg-zinc-950 border border-zinc-800/60 px-2 py-1 rounded-lg text-zinc-300 font-medium"
                >
                  {ex.name.split(' ')[0]}
                </span>
              ))}
            </div>

            {/* Action */}
            <button
              onClick={() => setTab('logger')}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 active:scale-98 hover:brightness-110 transition cursor-pointer"
            >
              <span>開始訓練紀錄</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-5 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800/50 mb-2">
              <Sparkles className="w-5 h-5 text-zinc-500" />
            </div>
            <p className="font-bold text-sm text-zinc-300">今天也是休息日！</p>
            <p className="text-[11px] text-zinc-500 mt-0.5 max-w-xs">
              今天是預排的休息日，好好放鬆肌肉以利修復。若想更換課表，請到「每週課表」調整。
            </p>
            <button
              onClick={() => setTab('planner')}
              className="mt-3.5 text-xs text-amber-500 font-semibold hover:underline"
            >
              前往安排課表 &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
