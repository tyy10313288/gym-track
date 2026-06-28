'use client';

import React from 'react';
import { Timer, Dumbbell, Calendar, FileText, CheckCircle, Clock } from 'lucide-react';
import { DailyRecord, CheckInStatus } from '../types/fitness';
import { WORKOUT_TEMPLATES } from '../constants/mockData';

const EXERCISE_SUGGESTIONS: Record<string, string[]> = {
  '胸部': [
    '槓鈴臥推 (胸大肌)',
    '啞鈴飛鳥 (胸肌外側)',
    '雙槓臂屈伸 (胸肌下緣)',
    '俯臥撐 (胸肌/三頭肌)'
  ],
  '背部': [
    '引體向上 (背闊肌)',
    '滑輪下拉 (背闊肌)',
    '滑輪划船 (中背肌群)',
    '啞鈴划船 (背部肌群)'
  ],
  '腿部': [
    '槓鈴深蹲 (股四頭肌/臀大肌)',
    '羅馬尼亞硬舉 (膕繩肌/臀大肌)',
    '器械腿推 (腿部肌群)',
    '弓步蹲 (臀大肌/股四頭肌)'
  ],
  '肩部': [
    '啞鈴肩推 (三角肌前束)',
    '啞鈴側平舉 (三角肌中束)',
    '啞鈴俯身飛鳥 (三角肌後束)',
    '槓鈴立姿划船 (三角肌/斜方肌)'
  ],
  '手臂': [
    '二頭彎舉 (肱二頭肌)',
    '三頭下拉 (肱三頭肌)',
    '錘式彎舉 (肱橈肌)',
    '仰臥三頭伸展 (肱三頭肌)'
  ],
  '核心/其它': [
    '平板支撐 (腹直肌/核心穩定)',
    '仰臥起坐 (腹直肌)',
    '懸垂舉腿 (下腹部/核心)',
    '滑輪伐木 (腹外斜肌)'
  ]
};

const BODY_PARTS = ['胸部', '背部', '腿部', '肩部', '手臂', '核心/其它'];

interface WorkoutViewProps {
  selectedDate: string;
  isToday: boolean;
  record: DailyRecord;
  onUpdateRecord: (updatedRecord: DailyRecord) => void;
  checkInStatus: CheckInStatus;
  timeLeft: number;
  onCheckIn: (duration: number) => void;
  onCheckOut: () => void;
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  selectedDate,
  isToday,
  record,
  onUpdateRecord,
  checkInStatus,
  timeLeft,
  onCheckIn,
  onCheckOut,
}) => {
  const { workout } = record;

  const handleToggleWorkout = () => {
    onUpdateRecord({
      ...record,
      workout: {
        ...workout,
        didWorkout: !workout.didWorkout,
        // Reset duration if turned off, or default to 45 if turned on and is 0
        duration: !workout.didWorkout ? (workout.duration || 45) : 0,
      },
    });
  };

  const handleDurationChange = (val: number) => {
    onUpdateRecord({
      ...record,
      workout: {
        ...workout,
        duration: Math.max(0, val),
      },
    });
  };

  const buildDescription = (categorized: Record<string, string>, generalNote: string) => {
    const parts = Object.entries(categorized)
      .filter(([_, val]) => val && val.trim() !== '')
      .map(([part, val]) => `[${part}] ${val}`);
    if (generalNote && generalNote.trim() !== '') {
      parts.push(`[備忘] ${generalNote}`);
    }
    return parts.join('\n');
  };

  const handleCategorizedChange = (bodyPart: string, val: string) => {
    const currentCat = workout.categorized || {};
    const newCat = {
      ...currentCat,
      [bodyPart]: val
    };
    onUpdateRecord({
      ...record,
      workout: {
        ...workout,
        categorized: newCat,
        description: buildDescription(newCat, workout.generalNote || '')
      }
    });
  };

  const handleGeneralNoteChange = (val: string) => {
    onUpdateRecord({
      ...record,
      workout: {
        ...workout,
        generalNote: val,
        description: buildDescription(workout.categorized || {}, val)
      }
    });
  };

  const handleAddSuggestion = (bodyPart: string, suggestion: string) => {
    const currentCat = workout.categorized || {};
    const currentVal = currentCat[bodyPart] || '';
    const newVal = currentVal ? `${currentVal}, ${suggestion}` : suggestion;
    
    const newCat = {
      ...currentCat,
      [bodyPart]: newVal
    };
    onUpdateRecord({
      ...record,
      workout: {
        ...workout,
        categorized: newCat,
        description: buildDescription(newCat, workout.generalNote || '')
      }
    });
  };


  const handleApplyTemplate = (templateId: string) => {
    if (!templateId) {
      onUpdateRecord({
        ...record,
        workout: {
          ...workout,
          templateId: undefined,
        },
      });
      return;
    }

    const template = WORKOUT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    const hasExistingContent = Object.values(workout.categorized || {}).some(
      (val) => val && val.trim() !== ''
    );

    if (hasExistingContent) {
      if (!confirm(`確定要套用「${template.name}」嗎？這將會覆寫您目前的訓練動作紀錄。`)) {
        return;
      }
    }

    const newCategorized: Record<string, string> = {};
    BODY_PARTS.forEach((part) => {
      newCategorized[part] = '';
    });

    const mapCategory = (cat: string): string => {
      switch (cat) {
        case '下肢': return '腿部';
        case '肩膀': return '肩部';
        case '核心': return '核心/其它';
        default: return cat;
      }
    };

    const getExerciseDisplayName = (ex: any): string => {
      switch (ex.exerciseId) {
        case 'bench-press': return '槓鈴臥推 (胸大肌)';
        case 'lat-pulldown': return '滑輪下拉 (背闊肌)';
        case 'dumbbell-shoulder-press': return '啞鈴肩推 (三角肌前束)';
        case 'cable-row': return '滑輪划船 (中背肌群)';
        case 'barbell-squat': return '槓鈴深蹲 (股四頭肌/臀大肌)';
        case 'romanian-deadlift': return '羅馬尼亞硬舉 (膕繩肌/臀大肌)';
        case 'leg-press': return '器械腿推 (腿部肌群)';
        case 'plank': return '平板支撐 (腹直肌/核心穩定)';
        case 'goblet-squat': return '高杯深蹲 (股四頭肌/臀大肌)';
        case 'push-up': return '伏地挺身 (胸肌/三頭肌)';
        case 'dumbbell-row': return '單臂啞鈴划船 (背部肌群)';
        case 'hanging-leg-raise': return '懸垂舉腿 (下腹部/核心)';
        default: return ex.name;
      }
    };

    template.exercises.forEach((ex) => {
      const targetPart = mapCategory(ex.category);
      const displayName = getExerciseDisplayName(ex);
      const current = newCategorized[targetPart];
      newCategorized[targetPart] = current ? `${current}, ${displayName}` : displayName;
    });

    onUpdateRecord({
      ...record,
      workout: {
        ...workout,
        templateId,
        categorized: newCategorized,
        description: buildDescription(newCategorized, workout.generalNote || ''),
      },
    });
  };

  // Helper to format remaining seconds into mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer helper values
  const totalSeconds = checkInStatus.durationMinutes * 60;
  const progressPercent = checkInStatus.isCheckedIn
    ? Math.min(100, Math.max(0, (timeLeft / totalSeconds) * 100))
    : 100;

  return (
    <div className="space-y-6">
      {/* 1. Countdown Timer Card */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-3xl p-5 shadow-lg relative overflow-hidden">
        {/* Decorative background glow */}
        {checkInStatus.isCheckedIn && (
          <div className="absolute -right-16 -top-16 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Timer className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-zinc-300">個室 Gym 倒數計時</h2>
          </div>
          {checkInStatus.isCheckedIn && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
              計時中
            </span>
          )}
        </div>

        {!checkInStatus.isCheckedIn ? (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400">請選擇私密健身房的使用時段以開始倒數：</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onCheckIn(40)}
                className="py-3 px-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-850 border border-zinc-700/50 hover:border-zinc-650 text-sm font-medium transition-all text-zinc-200 flex flex-col items-center justify-center space-y-1 active:scale-95 cursor-pointer"
              >
                <span className="text-sm font-bold text-zinc-100">Check In (40分鐘)</span>
                <span className="text-[10px] text-zinc-400">標準時段</span>
              </button>
              <button
                onClick={() => onCheckIn(80)}
                className="py-3 px-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-850 border border-zinc-700/50 hover:border-zinc-650 text-sm font-medium transition-all text-zinc-200 flex flex-col items-center justify-center space-y-1 active:scale-95 cursor-pointer"
              >
                <span className="text-sm font-bold text-zinc-100">Check In (80分鐘)</span>
                <span className="text-[10px] text-zinc-400">加長時段</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2 space-y-4">
            {/* Visual Circular/Linear progress timer */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Circular progress SVG */}
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  className="stroke-zinc-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Foreground circle */}
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  className="stroke-blue-500 transition-all duration-1000 ease-linear"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={402} // 2 * PI * r = 2 * 3.14159 * 64 = 402.12
                  strokeDashoffset={402 - (402 * progressPercent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black font-mono tracking-tight text-white">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5">
                  總共 {checkInStatus.durationMinutes} 分鐘
                </span>
              </div>
            </div>

            <button
              onClick={onCheckOut}
              className="px-6 py-2 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/40 text-xs font-semibold text-rose-400 transition-all active:scale-95 cursor-pointer"
            >
              Check Out
            </button>
          </div>
        )}
      </div>

      {/* 2. Workout Log Form */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-3xl p-5 shadow-lg space-y-5">
        <div className="flex items-center space-x-2 border-b border-zinc-800/60 pb-3">
          <Dumbbell className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-zinc-300">訓練日誌</h2>
        </div>

        {/* Toggle Button Card */}
        <button
          onClick={handleToggleWorkout}
          className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between active:scale-[0.99] cursor-pointer ${
            workout.didWorkout
              ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/30 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
              : 'bg-zinc-800/30 border-zinc-800 hover:border-zinc-700 text-zinc-400'
          }`}
        >
          <div className="flex items-center space-x-3 text-left">
            <div className={`p-2 rounded-xl transition-all ${
              workout.didWorkout ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'
            }`}>
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{workout.didWorkout ? '今日已完成訓練！' : '今日有否進行訓練？'}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">點擊切換訓練狀態</p>
            </div>
          </div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
            workout.didWorkout ? 'border-blue-400 bg-blue-500 text-white' : 'border-zinc-700 bg-transparent'
          }`}>
            {workout.didWorkout && <CheckCircle className="w-4 h-4 stroke-[3px]" />}
          </div>
        </button>

        {/* Expandable workout fields if workout.didWorkout is true */}
        {workout.didWorkout && (
          <div className="space-y-4 pt-1 animate-fadeIn">
            {/* Workout duration */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-zinc-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>訓練時長 (分鐘)</span>
                </label>
                <span className="text-sm font-bold text-zinc-200">{workout.duration} 分鐘</span>
              </div>
              <input
                type="range"
                min="5"
                max="185"
                step="5"
                value={workout.duration || 45}
                onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono px-0.5">
                <span>5m</span>
                <span>45m</span>
                <span>90m</span>
                <span>120m</span>
                <span>180m+</span>
              </div>
            </div>

            {/* Template selector */}
            <div className="space-y-2 border-t border-zinc-850/50 pt-4">
              <label className="text-xs font-semibold text-zinc-400 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>套用今日訓練課表</span>
              </label>
              <select
                value={workout.templateId || ''}
                onChange={(e) => handleApplyTemplate(e.target.value)}
                className="w-full text-xs bg-zinc-950 border border-zinc-850 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none transition-all font-medium cursor-pointer"
              >
                <option value="">自主訓練 (無套用範本)</option>
                {WORKOUT_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Categorized workout logging */}
            <div className="space-y-4 border-t border-zinc-850/50 pt-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>按部位記錄訓練項目</span>
              </h3>
              
              {BODY_PARTS.map((part) => {
                const currentVal = workout.categorized?.[part] || '';
                const suggestions = EXERCISE_SUGGESTIONS[part] || [];
                
                return (
                  <div key={part} className="space-y-2 bg-zinc-950/30 p-3 rounded-2xl border border-zinc-850/30">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-zinc-350">{part}</span>
                    </div>
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) => handleCategorizedChange(part, e.target.value)}
                      placeholder={`請輸入${part}訓練動作...`}
                      className="w-full text-xs bg-zinc-950 border border-zinc-850 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none transition-all placeholder-zinc-700 font-medium"
                    />
                    {suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {suggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => handleAddSuggestion(part, sug)}
                            className="text-[9px] px-2.5 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-zinc-200 transition-all active:scale-95 cursor-pointer border border-zinc-750/30 font-medium"
                          >
                            + {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* General Note */}
              <div className="space-y-2 bg-zinc-950/30 p-3 rounded-2xl border border-zinc-850/30">
                <label className="text-xs font-extrabold text-zinc-350">其它備忘</label>
                <textarea
                  value={workout.generalNote || ''}
                  onChange={(e) => handleGeneralNoteChange(e.target.value)}
                  placeholder="例如：今日訓練感覺如何、其它補充說明..."
                  rows={2}
                  className="w-full text-xs bg-zinc-950 border border-zinc-850 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none transition-all placeholder-zinc-700 font-medium resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected historical date notice if not editing today */}
      {!isToday && (
        <div className="text-center py-2">
          <p className="text-[11px] text-zinc-500">
            * 正在查看/修改 {selectedDate} 的歷史紀錄
          </p>
        </div>
      )}
    </div>
  );
};
