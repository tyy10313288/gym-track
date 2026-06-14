'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Plus, Minus, Check, Dumbbell, AlertCircle, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { WorkoutTemplate, WorkoutLog, LoggedExercise, LoggedSet, WeeklySchedule } from '../types/gym';
import { WORKOUT_TEMPLATES } from '../constants/mockData';

interface LoggerViewProps {
  todayTemplate: WorkoutTemplate | null;
  historyLogs: WorkoutLog[];
  onSaveLog: (log: WorkoutLog) => void;
  triggerRestTimer: () => void;
  setTab: (tab: string) => void;
  checkInStartTime: number | null;
}

export const LoggerView: React.FC<LoggerViewProps> = ({
  todayTemplate,
  historyLogs,
  onSaveLog,
  triggerRestTimer,
  setTab,
  checkInStartTime,
}) => {
  // Allow user to select a template if today is rest or they want to change
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplate | null>(todayTemplate || WORKOUT_TEMPLATES[0]);
  
  // Active workout state
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [savedSummary, setSavedSummary] = useState<{
    duration: number;
    totalVolume: number;
    completedSetsCount: number;
  } | null>(null);

  // Load template sets on component mount or template change
  useEffect(() => {
    if (!activeTemplate) return;

    // Build exercises list, checking historical logs for autofill
    const initialExercises: LoggedExercise[] = activeTemplate.exercises.map((item) => {
      // Find the most recent workout log containing this exercise to autofill
      let autofillSets: LoggedSet[] = [];
      
      // Sort logs descending by date
      const sortedLogs = [...historyLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      for (const log of sortedLogs) {
        const matchingExercise = log.exercises.find((ex) => ex.exerciseId === item.exerciseId);
        if (matchingExercise && matchingExercise.sets.length > 0) {
          autofillSets = matchingExercise.sets.map((set, idx) => ({
            id: `${item.exerciseId}-${idx}-${Date.now()}`,
            weight: set.weight,
            reps: set.reps,
            completed: false, // reset status
          }));
          break;
        }
      }

      // If no history found, fill with template defaults
      if (autofillSets.length === 0) {
        autofillSets = Array.from({ length: item.defaultSets }).map((_, idx) => ({
          id: `${item.exerciseId}-${idx}-${Date.now()}`,
          weight: item.defaultWeight,
          reps: item.defaultReps,
          completed: false,
        }));
      }

      return {
        exerciseId: item.exerciseId,
        name: item.name,
        category: item.category,
        sets: autofillSets,
      };
    });

    setExercises(initialExercises);
    setIsFinished(false);
    setSavedSummary(null);
  }, [activeTemplate, historyLogs]);

  // Adjust Weight (+/- 2.5 kg or 0.5 kg for smaller ones)
  const adjustWeight = (exerciseIdx: number, setIdx: number, increment: number) => {
    setExercises((prev) => {
      const copy = [...prev];
      const targetSet = copy[exerciseIdx].sets[setIdx];
      // Keep weight >= 0
      targetSet.weight = Math.max(0, parseFloat((targetSet.weight + increment).toFixed(1)));
      return copy;
    });
  };

  // Adjust Reps (+/- 1)
  const adjustReps = (exerciseIdx: number, setIdx: number, increment: number) => {
    setExercises((prev) => {
      const copy = [...prev];
      const targetSet = copy[exerciseIdx].sets[setIdx];
      targetSet.reps = Math.max(0, targetSet.reps + increment);
      return copy;
    });
  };

  // Toggle set completed
  const toggleSetComplete = (exerciseIdx: number, setIdx: number) => {
    let wasCompleted = false;

    setExercises((prev) => {
      const copy = [...prev];
      const targetSet = copy[exerciseIdx].sets[setIdx];
      targetSet.completed = !targetSet.completed;
      wasCompleted = targetSet.completed;
      return copy;
    });

    // If set is completed, trigger the 60-second rest countdown
    if (wasCompleted) {
      triggerRestTimer();
    }
  };

  // Add set to exercise
  const addSet = (exerciseIdx: number) => {
    setExercises((prev) => {
      const copy = [...prev];
      const sets = copy[exerciseIdx].sets;
      const lastSet = sets[sets.length - 1] || { weight: 20, reps: 10 };
      
      sets.push({
        id: `${copy[exerciseIdx].exerciseId}-${sets.length}-${Date.now()}`,
        weight: lastSet.weight,
        reps: lastSet.reps,
        completed: false,
      });
      return copy;
    });
  };

  // Delete last set from exercise
  const removeLastSet = (exerciseIdx: number) => {
    setExercises((prev) => {
      const copy = [...prev];
      if (copy[exerciseIdx].sets.length > 1) {
        copy[exerciseIdx].sets.pop();
      }
      return copy;
    });
  };

  // Calculate stats and save workout
  const handleFinishWorkout = () => {
    if (exercises.length === 0) return;

    // Calculate duration
    let duration = 40; // Default fallback
    if (checkInStartTime) {
      duration = Math.round((Date.now() - checkInStartTime) / (60 * 1000));
      if (duration < 1) duration = 1;
    }

    // Calculate tonnage volume & completed sets
    let totalVolume = 0;
    let completedSetsCount = 0;

    exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.completed) {
          totalVolume += set.weight * set.reps;
          completedSetsCount += 1;
        }
      });
    });

    const newLog: WorkoutLog = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      templateId: activeTemplate?.id || 'manual',
      templateName: activeTemplate?.name || '自主訓練',
      exercises: exercises.map((ex) => ({
        ...ex,
        sets: ex.sets.filter((s) => s.completed), // only save completed sets
      })).filter((ex) => ex.sets.length > 0), // only save exercises with completed sets
      durationMinutes: duration,
    };

    onSaveLog(newLog);
    setSavedSummary({ duration, totalVolume, completedSetsCount });
    setIsFinished(true);
  };

  // UI rendering for Finished Workout Modal state
  if (isFinished && savedSummary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 text-zinc-100">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 className="w-9 h-9 text-emerald-400" />
        </div>
        
        <h1 className="text-2xl font-black text-zinc-100">
          恭喜完成今日訓練！
        </h1>
        <p className="text-xs text-zinc-400 mt-1.5">
          數據已自動儲存至本地快取並上傳雲端 (若已綁定)。
        </p>

        {/* Stats Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 w-full max-w-sm mt-8 space-y-4 text-sm text-left">
          <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
            <span className="text-zinc-500 font-medium">所選課表</span>
            <span className="font-bold text-zinc-200">{activeTemplate?.name.split('：')[1] || '自主訓練'}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
            <span className="text-zinc-500 font-medium">訓練時長</span>
            <span className="font-bold text-amber-500">{savedSummary.duration} 分鐘</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
            <span className="text-zinc-500 font-medium">完成組數</span>
            <span className="font-bold text-zinc-200">{savedSummary.completedSetsCount} 組</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-zinc-500 font-medium">累積總容量</span>
            <span className="font-black text-rose-500 text-base">{savedSummary.totalVolume.toLocaleString()} kg</span>
          </div>
        </div>

        <button
          onClick={() => setTab('dashboard')}
          className="mt-8 px-8 py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 font-bold rounded-xl text-xs active:scale-95 transition flex items-center space-x-1"
        >
          <span>回到首頁打卡</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-24 text-zinc-100">
      {/* Top Template Selector Header */}
      <div className="mb-5 flex flex-col xs:flex-row xs:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">
            極簡訓練紀錄
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            免打字記錄。完成組數打勾將啟動 60 秒組間休息。
          </p>
        </div>
        
        {/* Dropdown switch template */}
        <select
          value={activeTemplate?.id || ''}
          onChange={(e) => {
            const selected = WORKOUT_TEMPLATES.find((t) => t.id === e.target.value);
            if (selected) setActiveTemplate(selected);
          }}
          className="text-xs bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500/40 font-semibold text-zinc-200"
        >
          {WORKOUT_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name.split('：')[1]}
            </option>
          ))}
        </select>
      </div>

      {/* Exercises List */}
      <div className="space-y-6 mb-8">
        {exercises.map((ex, exIdx) => (
          <div key={ex.exerciseId} className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-4">
            {/* Header info */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <Dumbbell className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-sm text-zinc-100">{ex.name}</h3>
              </div>
              <span className="text-[10px] bg-zinc-800/80 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800">
                {ex.category}
              </span>
            </div>

            {/* Set Row Headers */}
            <div className="grid grid-cols-12 gap-1.5 text-[10px] font-bold text-zinc-500 uppercase mb-2 px-1 text-center">
              <div className="col-span-1 text-left">組</div>
              <div className="col-span-5">重量 (kg)</div>
              <div className="col-span-4">次數</div>
              <div className="col-span-2">完成</div>
            </div>

            {/* Set Rows */}
            <div className="space-y-2">
              {ex.sets.map((set, setIdx) => (
                <div
                  key={set.id}
                  className={`grid grid-cols-12 gap-1.5 items-center p-1.5 rounded-xl border transition ${
                    set.completed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-zinc-200'
                      : 'bg-zinc-950/40 border-zinc-800/40'
                  }`}
                >
                  {/* Set number */}
                  <div className="col-span-1 text-center font-bold text-xs text-zinc-400">{setIdx + 1}</div>

                  {/* Weight adjust selectors */}
                  <div className="col-span-5 flex items-center justify-center space-x-1">
                    <button
                      onClick={() => adjustWeight(exIdx, setIdx, -2.5)}
                      disabled={set.completed}
                      className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 active:scale-90 transition disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-14 text-center font-mono font-bold text-xs tabular-nums text-zinc-200">
                      {set.weight}
                    </span>
                    <button
                      onClick={() => adjustWeight(exIdx, setIdx, 2.5)}
                      disabled={set.completed}
                      className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 active:scale-90 transition disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Reps adjust selectors */}
                  <div className="col-span-4 flex items-center justify-center space-x-1">
                    <button
                      onClick={() => adjustReps(exIdx, setIdx, -1)}
                      disabled={set.completed}
                      className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 active:scale-90 transition disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-xs tabular-nums text-zinc-200">
                      {set.reps}
                    </span>
                    <button
                      onClick={() => adjustReps(exIdx, setIdx, 1)}
                      disabled={set.completed}
                      className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 active:scale-90 transition disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Status checkbox */}
                  <div className="col-span-2 flex justify-center">
                    <button
                      onClick={() => toggleSetComplete(exIdx, setIdx)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition border ${
                        set.completed
                          ? 'bg-emerald-500 border-emerald-600 text-zinc-950 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Set manipulators */}
            <div className="flex space-x-2 justify-end mt-3 text-[10px]">
              <button
                onClick={() => addSet(exIdx)}
                className="text-zinc-500 hover:text-zinc-300 font-bold px-2 py-1 flex items-center space-x-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>加一組</span>
              </button>
              {ex.sets.length > 1 && (
                <button
                  onClick={() => removeLastSet(exIdx)}
                  className="text-zinc-600 hover:text-rose-400 font-bold px-2 py-1 flex items-center space-x-0.5"
                >
                  <Minus className="w-3 h-3" />
                  <span>減一組</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Complete Session Action Button */}
      <button
        onClick={handleFinishWorkout}
        disabled={exercises.length === 0}
        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 font-bold rounded-2xl flex items-center justify-center space-x-1.5 shadow-xl hover:brightness-110 active:scale-98 transition disabled:opacity-40"
      >
        <CheckCircle2 className="w-5 h-5" />
        <span className="text-sm font-black tracking-wide">完成本日訓練</span>
      </button>
    </div>
  );
};
