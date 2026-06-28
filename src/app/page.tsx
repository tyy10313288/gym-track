'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Wifi, Battery, Calendar, Undo2, Award, Settings } from 'lucide-react';
import { DailyRecord, DailyRecords, CheckInStatus } from '../types/fitness';
import { BottomNav } from '../components/BottomNav';
import { WorkoutView } from '../components/WorkoutView';
import { DietView } from '../components/DietView';
import { StatsView } from '../components/StatsView';
import { SettingsModal } from '../components/SettingsModal';
import { BodyView } from '../components/BodyView';

// Helper to format Date into YYYY-MM-DD
const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function Home() {
  // Navigation active tab: 'workout' | 'diet' | 'stats'
  const [activeTab, setActiveTab] = useState<string>('workout');
  
  // Mounted status to prevent Next.js hydration mismatches
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  // Active Selected Date (defaults to today's date string YYYY-MM-DD on mount)
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // All daily records dictionary
  const [records, setRecords] = useState<DailyRecords>({});
  

  // Settings modal visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Cloud Sync settings state
  const [syncConfig, setSyncConfig] = useState<{
    webAppUrl: string;
    lastSyncedAt: string | null;
  }>({
    webAppUrl: '',
    lastSyncedAt: null,
  });

  // Countdown check-in status
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>({
    isCheckedIn: false,
    startTime: null,
    durationMinutes: 40,
  });
  
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Get today's local date string
  const todayStr = useMemo(() => {
    if (!isMounted) return '';
    return formatDateStr(new Date());
  }, [isMounted]);

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const today = formatDateStr(new Date());
    setSelectedDate(today);

    try {
      const savedRecords = localStorage.getItem('fitness_diet_records');
      if (savedRecords) {
        setRecords(JSON.parse(savedRecords));
      }

      const savedSync = localStorage.getItem('fitness_sync_config');
      if (savedSync) {
        setSyncConfig(JSON.parse(savedSync));
      }


      const savedCheckIn = localStorage.getItem('fitness_gym_checkin');
      if (savedCheckIn) {
        const parsed: CheckInStatus = JSON.parse(savedCheckIn);
        if (parsed.isCheckedIn && parsed.startTime) {
          const elapsedSeconds = Math.floor((Date.now() - parsed.startTime) / 1000);
          const totalSeconds = parsed.durationMinutes * 60;
          if (elapsedSeconds < totalSeconds) {
            setCheckInStatus(parsed);
          } else {
            localStorage.removeItem('fitness_gym_checkin');
          }
        }
      }
    } catch (e) {
      console.error('Failed to load local storage data:', e);
    }
  }, []);

  // Save records to localStorage when updated
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('fitness_diet_records', JSON.stringify(records));
  }, [records, isMounted]);

  // Save syncConfig to localStorage when updated
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('fitness_sync_config', JSON.stringify(syncConfig));
  }, [syncConfig, isMounted]);


  // Save check-in status when updated
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('fitness_gym_checkin', JSON.stringify(checkInStatus));
  }, [checkInStatus, isMounted]);

  // Countdown timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (checkInStatus.isCheckedIn && checkInStatus.startTime) {
      const tick = () => {
        const elapsedSeconds = Math.floor((Date.now() - checkInStatus.startTime!) / 1000);
        const totalSeconds = checkInStatus.durationMinutes * 60;
        const remaining = Math.max(0, totalSeconds - elapsedSeconds);

        setTimeLeft(remaining);

        if (remaining === 0) {
          // Timer finished, checkout automatically
          setCheckInStatus({
            isCheckedIn: false,
            startTime: null,
            durationMinutes: 40,
          });
        }
      };

      tick(); // initial tick
      timer = setInterval(tick, 1000);
    } else {
      setTimeLeft(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [checkInStatus]);

  // Check-In start/stop handlers
  const handleCheckIn = (duration: number) => {
    setCheckInStatus({
      isCheckedIn: true,
      startTime: Date.now(),
      durationMinutes: duration,
    });
  };

  const handleCheckOut = () => {
    if (confirm('確定要 Check Out 嗎？')) {
      setCheckInStatus({
        isCheckedIn: false,
        startTime: null,
        durationMinutes: 40,
      });
    }
  };

  // Get current record for selectedDate (or default and pre-populate TDEE)
  const currentRecord = useMemo((): DailyRecord => {
    if (!selectedDate) {
      return {
        date: '',
        tdee: 2000,
        intake: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 },
        workout: { didWorkout: false, duration: 0, description: '' },
        body: { weight: null, bodyFat: null, muscle: null }
      };
    }

    if (records[selectedDate]) {
      const record = records[selectedDate];
      if (!record.body) {
        return {
          ...record,
          body: { weight: null, bodyFat: null, muscle: null }
        };
      }
      return record;
    }

    // Attempt to copy the most recent configured TDEE if no record exists for this date
    const sortedDates = Object.keys(records).sort((a, b) => b.localeCompare(a));
    const defaultTdee = sortedDates.length > 0 ? records[sortedDates[0]].tdee : 2000;

    return {
      date: selectedDate,
      tdee: defaultTdee,
      intake: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 },
      workout: { didWorkout: false, duration: 0, description: '' },
      body: { weight: null, bodyFat: null, muscle: null }
    };
  }, [records, selectedDate]);

  const handleUpdateRecord = (updated: DailyRecord) => {
    if (!selectedDate) return;
    setRecords((prev) => ({
      ...prev,
      [selectedDate]: updated,
    }));
  };

  const handleSaveUrl = (url: string) => {
    setSyncConfig((prev) => ({
      ...prev,
      webAppUrl: url,
    }));
  };

  const handleSyncPush = async (): Promise<boolean> => {
    if (!syncConfig.webAppUrl) return false;
    try {
      const res = await fetch(syncConfig.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain', // Use text/plain to bypass CORS preflight restrictions in Apps Script
        },
        body: JSON.stringify({
          records,
        }),
      });
      if (res.ok) {
        setSyncConfig((prev) => ({
          ...prev,
          lastSyncedAt: new Date().toISOString(),
        }));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Push sync failed:', e);
      return false;
    }
  };

  const handleSyncPull = async (): Promise<boolean> => {
    if (!syncConfig.webAppUrl) return false;
    try {
      const res = await fetch(syncConfig.webAppUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          const normalizedData: DailyRecords = {};
          Object.keys(data).forEach((key) => {
            const rec = data[key];
            const normalizedKey = key.replace(/\//g, '-');
            if (rec) {
              if (rec.body) {
                if (rec.body.bodyFat !== null && rec.body.bodyFat !== undefined) {
                  rec.body.bodyFat = Math.round(rec.body.bodyFat * 10) / 10;
                }
                if (rec.body.muscle !== null && rec.body.muscle !== undefined) {
                  rec.body.muscle = Math.round(rec.body.muscle * 10) / 10;
                }
              }
              normalizedData[normalizedKey] = rec;
            }
          });
          setRecords(normalizedData);
          setSyncConfig((prev) => ({
            ...prev,
            lastSyncedAt: new Date().toISOString(),
          }));
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Pull sync failed:', e);
      return false;
    }
  };

  const isTodaySelected = selectedDate === todayStr;

  // Render a clean loading shell to avoid server-client text hydration mismatches
  if (!isMounted || !selectedDate) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-sans antialiased py-0 sm:py-8 sm:px-4">
        <div className="w-full max-w-md min-h-screen sm:min-h-[850px] sm:max-h-[880px] bg-zinc-950 border-0 sm:border-8 sm:border-zinc-800 rounded-none sm:rounded-[40px] shadow-2xl relative flex items-center justify-center">
          <span className="text-sm text-zinc-500 animate-pulse">載入中...</span>
        </div>
      </main>
    );
  }

  // Format header date: e.g. 2026年6月21日
  const formatHeaderDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`;
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-sans antialiased py-0 sm:py-8 sm:px-4">
      {/* Mobile-Chassis Wrapper for Desktop Presentation */}
      <div className="w-full max-w-md min-h-screen sm:min-h-[850px] sm:max-h-[880px] bg-zinc-950 border-0 sm:border-8 sm:border-zinc-800 rounded-none sm:rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col pb-16">
        
        {/* Device Status Bar Simulator (Desktop screens) */}
        <div className="hidden sm:flex h-9 bg-zinc-950 px-8 items-center justify-between text-zinc-500 text-[10px] select-none shrink-0 border-b border-zinc-900/40">
          <span className="font-bold text-zinc-400">9:41</span>
          <div className="w-12 h-3.5 bg-zinc-900 border border-zinc-800/80 rounded-full flex justify-center items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
          </div>
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Global Premium App Header */}
        <div className="px-5 pt-5 pb-3 shrink-0 bg-zinc-950 border-b border-zinc-900/60 z-30">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-black tracking-tight text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-blue-400" />
              <span>健身與飲食日誌</span>
            </h1>
            
            <div className="flex items-center space-x-3">
              {/* Settings Cog */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                title="雲端設定"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Active page indicator */}
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                {activeTab === 'workout' && '訓練'}
                {activeTab === 'diet' && '飲食'}
                {activeTab === 'body' && '磅重'}
                {activeTab === 'stats' && '統計'}
              </span>
            </div>
          </div>

          {/* Selected Date Header and Switcher Banner */}
          <div className="mt-3 flex items-center justify-between bg-zinc-900/40 border border-zinc-900/80 rounded-2xl px-3.5 py-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-200">
                {formatHeaderDate(selectedDate)}
              </span>
              {isTodaySelected ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                  今天
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                  歷史
                </span>
              )}
            </div>

            {!isTodaySelected && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-all flex items-center space-x-1 active:scale-95 cursor-pointer"
              >
                <Undo2 className="w-3 h-3" />
                <span>返回今天</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable SPA View Content Shell */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-none">
          {activeTab === 'workout' && (
            <WorkoutView
              selectedDate={selectedDate}
              isToday={isTodaySelected}
              record={currentRecord}
              onUpdateRecord={handleUpdateRecord}
              checkInStatus={checkInStatus}
              timeLeft={timeLeft}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
            />
          )}

          {activeTab === 'diet' && (
            <DietView
              selectedDate={selectedDate}
              isToday={isTodaySelected}
              record={currentRecord}
              onUpdateRecord={handleUpdateRecord}
            />
          )}

          {activeTab === 'body' && (
            <BodyView
              selectedDate={selectedDate}
              isToday={isTodaySelected}
              record={currentRecord}
              onUpdateRecord={handleUpdateRecord}
            />
          )}

          {activeTab === 'stats' && (
            <StatsView
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              records={records}
              setTab={setActiveTab}
            />
          )}
        </div>

        {/* Floating Bottom Navigator */}
        <BottomNav
          currentTab={activeTab}
          setTab={setActiveTab}
          isCheckedIn={checkInStatus.isCheckedIn}
          timeLeft={timeLeft}
        />
      </div>

      {/* Cloud Sync Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        webAppUrl={syncConfig.webAppUrl}
        onSaveUrl={handleSaveUrl}
        records={records}
        onSyncPush={handleSyncPush}
        onSyncPull={handleSyncPull}
        lastSyncedAt={syncConfig.lastSyncedAt}
      />
    </main>
  );
}
