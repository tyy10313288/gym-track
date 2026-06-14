'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, Battery } from 'lucide-react';
import { CheckInStatus, WeeklySchedule, WorkoutLog, SyncConfig, DayOfWeek, WorkoutTemplate } from '../types/gym';
import { DEFAULT_WEEKLY_SCHEDULE, MOCK_WORKOUT_LOGS, WORKOUT_TEMPLATES } from '../constants/mockData';
import { BottomNav } from '../components/BottomNav';
import { DashboardView } from '../components/DashboardView';
import { PlannerView } from '../components/PlannerView';
import { LoggerView } from '../components/LoggerView';
import { SettingsView } from '../components/SettingsView';
import { RestTimer } from '../components/RestTimer';

export default function Home() {
  // Navigation Routing Tab State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // App Global Data State
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>({
    isCheckedIn: false,
    startTime: null,
    durationMinutes: 40,
  });
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_WEEKLY_SCHEDULE);
  const [logs, setLogs] = useState<WorkoutLog[]>(MOCK_WORKOUT_LOGS);
  const [syncConfig, setSyncConfig] = useState<SyncConfig>({
    webAppUrl: '',
    lastSyncedAt: null,
  });

  // Floating Rest Timer State
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);

  // Load state from localStorage on Mount
  useEffect(() => {
    try {
      const savedCheckIn = localStorage.getItem('gym_checkin_status');
      if (savedCheckIn) {
        const parsed = JSON.parse(savedCheckIn);
        // Validate if check-in hasn't expired yet
        if (parsed.isCheckedIn && parsed.startTime) {
          const elapsedSeconds = Math.floor((Date.now() - parsed.startTime) / 1000);
          const totalSeconds = parsed.durationMinutes * 60;
          if (elapsedSeconds < totalSeconds) {
            setCheckInStatus(parsed);
          } else {
            // Expired while offline
            localStorage.removeItem('gym_checkin_status');
          }
        }
      }

      const savedSchedule = localStorage.getItem('gym_schedule');
      if (savedSchedule) {
        setSchedule(JSON.parse(savedSchedule));
      }

      const savedLogs = localStorage.getItem('gym_logs');
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      }

      const savedSync = localStorage.getItem('gym_sync_config');
      if (savedSync) {
        setSyncConfig(JSON.parse(savedSync));
      }
    } catch (e) {
      console.error('Failed to load localStorage state:', e);
    }
  }, []);

  // Save states to localStorage when updated
  useEffect(() => {
    localStorage.setItem('gym_checkin_status', JSON.stringify(checkInStatus));
  }, [checkInStatus]);

  useEffect(() => {
    localStorage.setItem('gym_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('gym_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('gym_sync_config', JSON.stringify(syncConfig));
  }, [syncConfig]);

  // Main countdown timer execution
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (checkInStatus.isCheckedIn && checkInStatus.startTime) {
      const tick = () => {
        const elapsedSeconds = Math.floor((Date.now() - checkInStatus.startTime!) / 1000);
        const totalSeconds = checkInStatus.durationMinutes * 60;
        const remaining = Math.max(0, totalSeconds - elapsedSeconds);
        
        setTimeLeft(remaining);

        if (remaining === 0) {
          // Timer finished
          setCheckInStatus({
            isCheckedIn: false,
            startTime: null,
            durationMinutes: 40,
          });
        }
      };

      tick(); // run initial calculation
      timer = setInterval(tick, 1000);
    } else {
      setTimeLeft(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [checkInStatus]);

  // Check-In handlers
  const handleCheckIn = (duration: number) => {
    setCheckInStatus({
      isCheckedIn: true,
      startTime: Date.now(),
      durationMinutes: duration,
    });
  };

  const handleCheckOut = () => {
    if (confirm('確定要提前結束出館嗎？')) {
      setCheckInStatus({
        isCheckedIn: false,
        startTime: null,
        durationMinutes: 40,
      });
    }
  };

  // Workout Log save triggers
  const handleSaveLog = (newLog: WorkoutLog) => {
    setLogs((prev) => [newLog, ...prev]);
    // Auto upload single log to Google Sheets if configured
    if (syncConfig.webAppUrl) {
      fetch(syncConfig.webAppUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add_log',
          log: newLog,
        }),
      }).catch((err) => console.error('Auto upload log failed:', err));
    }
  };

  // Google Sheets Push API
  const handleSyncPush = async (): Promise<boolean> => {
    if (!syncConfig.webAppUrl) return false;
    try {
      const payload = {
        action: 'sync_all',
        schedule,
        logs,
      };
      
      const res = await fetch(syncConfig.webAppUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSyncConfig((prev) => ({
          ...prev,
          lastSyncedAt: new Date().toISOString(),
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Cloud upload error:', error);
      return false;
    }
  };

  // Google Sheets Pull API
  const handleSyncPull = async (): Promise<boolean> => {
    if (!syncConfig.webAppUrl) return false;
    try {
      const res = await fetch(syncConfig.webAppUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.schedule && Object.keys(data.schedule).length > 0) {
          setSchedule(data.schedule);
        }
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
        setSyncConfig((prev) => ({
          ...prev,
          lastSyncedAt: new Date().toISOString(),
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Cloud download error:', error);
      return false;
    }
  };

  // Determine current day of week to lookup scheduled template
  const todayTemplate = React.useMemo(() => {
    const daysMap: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = daysMap[new Date().getDay()];
    const assignedTemplateId = schedule[currentDay];
    
    if (!assignedTemplateId || assignedTemplateId === 'rest') {
      return null;
    }
    
    return WORKOUT_TEMPLATES.find((t) => t.id === assignedTemplateId) || null;
  }, [schedule]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-sans antialiased py-0 sm:py-8 sm:px-4">
      
      {/* Mobile-Chassis Wrapper for Desktop Presentation */}
      <div className="w-full max-w-md min-h-screen sm:min-h-[850px] sm:max-h-[880px] bg-zinc-950 border-0 sm:border-8 sm:border-zinc-800 rounded-none sm:rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Device Status Bar Simulator (Visible only on desktop screens for native look) */}
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

        {/* Scrollable SPA Router Shell Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 scrollbar-none">
          {activeTab === 'dashboard' && (
            <DashboardView
              checkInStatus={checkInStatus}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              timeLeft={timeLeft}
              todayTemplate={todayTemplate}
              setTab={setActiveTab}
            />
          )}

          {activeTab === 'planner' && (
            <PlannerView
              schedule={schedule}
              updateSchedule={(newSched) => {
                setSchedule(newSched);
                // Trigger auto background sync to google sheet if possible
                if (syncConfig.webAppUrl) {
                  fetch(syncConfig.webAppUrl, {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update_schedule', schedule: newSched }),
                  }).catch((err) => console.error('Auto sync schedule failed:', err));
                }
              }}
            />
          )}

          {activeTab === 'logger' && (
            <LoggerView
              todayTemplate={todayTemplate}
              historyLogs={logs}
              onSaveLog={handleSaveLog}
              triggerRestTimer={() => setIsRestTimerActive(true)}
              setTab={setActiveTab}
              checkInStartTime={checkInStatus.startTime}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              syncConfig={syncConfig}
              setSyncConfig={setSyncConfig}
              logs={logs}
              schedule={schedule}
              onSyncPush={handleSyncPush}
              onSyncPull={handleSyncPull}
            />
          )}
        </div>

        {/* Floating組間休息 Rest Timer Overlay HUD */}
        {isRestTimerActive && (
          <RestTimer
            durationSeconds={60}
            onClose={() => setIsRestTimerActive(false)}
          />
        )}

        {/* Floating Bottom Navigator */}
        <BottomNav
          currentTab={activeTab}
          setTab={setActiveTab}
          isCheckedIn={checkInStatus.isCheckedIn}
          timeLeft={timeLeft}
        />
      </div>
    </main>
  );
}
