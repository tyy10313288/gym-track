'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, Trash2, Check, BarChart2, GripVertical, Info } from 'lucide-react';
import { WeeklySchedule, WorkoutTemplate } from '../types/gym';
import { WORKOUT_TEMPLATES } from '../constants/mockData';

interface PlannerViewProps {
  schedule: WeeklySchedule;
  updateSchedule: (schedule: WeeklySchedule) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  schedule,
  updateSchedule,
}) => {
  // Mobile tap-to-select template helper state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  // HTML5 Drag state
  const [draggedTemplateId, setDraggedTemplateId] = useState<string | null>(null);
  const [activeDropDay, setActiveDropDay] = useState<string | null>(null);

  const daysOfWeek: { key: keyof WeeklySchedule; label: string; enLabel: string }[] = [
    { key: 'Mon', label: '星期一', enLabel: 'Monday' },
    { key: 'Tue', label: '星期二', enLabel: 'Tuesday' },
    { key: 'Wed', label: '星期三', enLabel: 'Wednesday' },
    { key: 'Thu', label: '星期四', enLabel: 'Thursday' },
    { key: 'Fri', label: '星期五', enLabel: 'Friday' },
    { key: 'Sat', label: '星期六', enLabel: 'Saturday' },
    { key: 'Sun', label: '星期日', enLabel: 'Sunday' },
  ];

  // Map Template choices
  const templateChoices = useMemo(() => {
    return [
      ...WORKOUT_TEMPLATES,
      {
        id: 'rest',
        name: '休息日',
        description: '充分修補肌肉纖維，放鬆精神。',
        targetMuscles: [],
        exercises: [],
      },
    ];
  }, []);

  // Compute muscle analytics for scheduled workouts
  const muscleAnalytics = useMemo(() => {
    const counts: { [key: string]: number } = {
      '胸部': 0,
      '背部': 0,
      '下肢': 0,
      '肩膀': 0,
      '核心': 0,
    };

    let totalExercises = 0;

    Object.values(schedule).forEach((templateId) => {
      if (templateId === 'rest') return;
      const template = WORKOUT_TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        template.exercises.forEach((ex) => {
          const category = ex.category;
          if (counts[category] !== undefined) {
            counts[category] += ex.defaultSets;
            totalExercises += ex.defaultSets;
          }
        });
      }
    });

    return { counts, totalExercises };
  }, [schedule]);

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTemplateId(id);
    e.dataTransfer.setData('text/plain', id);
    // Visual feedback for dragging
    e.currentTarget.classList.add('opacity-40');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTemplateId(null);
    e.currentTarget.classList.remove('opacity-40');
  };

  // Drag Over Drop Target
  const handleDragOver = (e: React.DragEvent, day: string) => {
    e.preventDefault();
    setActiveDropDay(day);
  };

  const handleDragLeave = () => {
    setActiveDropDay(null);
  };

  // Drop Event
  const handleDrop = (e: React.DragEvent, day: keyof WeeklySchedule) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedTemplateId;
    if (id) {
      const newSchedule = { ...schedule, [day]: id };
      updateSchedule(newSchedule);
    }
    setActiveDropDay(null);
    setSelectedTemplateId(null); // Clear selected state
  };

  // Tap to Assign workflow (best for Mobile users)
  const handleSelectTemplate = (id: string) => {
    if (selectedTemplateId === id) {
      setSelectedTemplateId(null); // Toggle select off
    } else {
      setSelectedTemplateId(id);
    }
  };

  const handleDayTap = (day: keyof WeeklySchedule) => {
    if (selectedTemplateId) {
      const newSchedule = { ...schedule, [day]: selectedTemplateId };
      updateSchedule(newSchedule);
      setSelectedTemplateId(null); // reset selection
    } else {
      // If no template is selected, we let them quickly toggle to Rest Day or clear
      const current = schedule[day];
      const newSchedule = { 
        ...schedule, 
        [day]: current === 'rest' ? WORKOUT_TEMPLATES[0].id : 'rest' 
      };
      updateSchedule(newSchedule);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-24 text-zinc-100">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">
          每週課表排程
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          建立你的訓練規劃。拖曳範本至星期，或在手機上<strong>點選範本再點擊日期</strong>。
        </p>
      </div>

      {/* Muscle Focus Analytics */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 mb-6">
        <h2 className="text-xs text-zinc-400 font-bold tracking-wider mb-3 flex items-center space-x-1.5">
          <BarChart2 className="w-4 h-4 text-amber-500" />
          <span>本週肌群刺激分佈 (依排程組數統計)</span>
        </h2>

        {muscleAnalytics.totalExercises > 0 ? (
          <div className="space-y-3">
            {Object.entries(muscleAnalytics.counts).map(([muscle, sets]) => {
              const percentage = muscleAnalytics.totalExercises 
                ? Math.round((sets / muscleAnalytics.totalExercises) * 100) 
                : 0;

              // Color codes per muscle
              const colors: { [key: string]: string } = {
                '胸部': 'from-rose-500 to-red-500',
                '背部': 'from-amber-500 to-orange-500',
                '下肢': 'from-emerald-500 to-teal-500',
                '肩膀': 'from-indigo-500 to-purple-500',
                '核心': 'from-sky-500 to-blue-500',
              };

              return (
                <div key={muscle} className="text-[11px]">
                  <div className="flex justify-between font-medium text-zinc-300 mb-1">
                    <span>{muscle}</span>
                    <span className="text-zinc-500">{sets} 組 ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800/40">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${colors[muscle] || 'from-zinc-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500 text-center py-2">排定訓練計畫後，此處將顯示肌群刺激百分比。</p>
        )}
      </div>

      {/* Mon - Sun Schedule Stack */}
      <div className="space-y-2.5 mb-6">
        {daysOfWeek.map((day) => {
          const assignedId = schedule[day.key];
          const template = templateChoices.find((t) => t.id === assignedId);
          const isRest = assignedId === 'rest';
          const isDraggingOver = activeDropDay === day.key;

          return (
            <div
              key={day.key}
              onDragOver={(e) => handleDragOver(e, day.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day.key)}
              onClick={() => handleDayTap(day.key)}
              className={`relative rounded-xl p-3.5 border transition-all duration-200 select-none flex items-center justify-between cursor-pointer ${
                isDraggingOver
                  ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                  : isRest
                  ? 'border-zinc-800/40 bg-zinc-950/20 hover:bg-zinc-900/10 text-zinc-400'
                  : 'border-zinc-850 bg-zinc-900/40 hover:bg-zinc-900/60'
              }`}
            >
              {/* Day info */}
              <div className="flex items-center space-x-3.5">
                <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center font-black text-xs ${
                  isRest ? 'bg-zinc-950 border border-zinc-900 text-zinc-500' : 'bg-amber-500/10 border border-amber-500/25 text-amber-500'
                }`}>
                  <span className="text-[10px] leading-tight font-medium">週</span>
                  <span className="text-xs leading-none">{day.label.slice(2)}</span>
                </div>
                
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-100 flex items-center space-x-1.5">
                    <span>{template ? template.name : '休息日'}</span>
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5 max-w-[200px] line-clamp-1">
                    {template?.description || '今天讓肌肉好好復原休息。'}
                  </p>
                </div>
              </div>

              {/* Status Tag */}
              <div>
                {isRest ? (
                  <span className="text-[9px] bg-zinc-950 text-zinc-600 px-2 py-0.5 rounded-md font-medium border border-zinc-900">
                    REST
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1 justify-end max-w-[80px]">
                    {template?.targetMuscles.map((muscle) => (
                      <span
                        key={muscle}
                        className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/10 px-1 rounded-md"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Templates Draggable Tray */}
      <div className="bg-zinc-900/80 border border-zinc-800 backdrop-blur-md rounded-2xl p-4 sticky bottom-18">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-xs text-zinc-300 uppercase tracking-wider">
            {selectedTemplateId ? '選擇放置的日期（點擊上方天數）' : '訓練計畫範本庫'}
          </h3>
          {selectedTemplateId && (
            <button
              onClick={() => setSelectedTemplateId(null)}
              className="text-[10px] text-amber-500 hover:underline"
            >
              取消選取
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {templateChoices.map((choice) => {
            const isSelected = selectedTemplateId === choice.id;
            const isRest = choice.id === 'rest';

            return (
              <div
                key={choice.id}
                draggable
                onDragStart={(e) => handleDragStart(e, choice.id)}
                onDragEnd={handleDragEnd}
                onClick={() => handleSelectTemplate(choice.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-grab active:cursor-grabbing transition-all select-none ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                    : isRest
                    ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:bg-zinc-950'
                    : 'border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex-1 min-w-0 pr-1.5">
                  <span className="font-bold text-[11px] block truncate text-zinc-200">
                    {choice.name}
                  </span>
                  <span className="text-[9px] text-zinc-500 block truncate mt-0.5">
                    {choice.exercises.length > 0 ? `${choice.exercises.length} 個動作` : '放鬆肌肉'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1 shrink-0">
                  {isSelected ? (
                    <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-zinc-950">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <GripVertical className="w-3.5 h-3.5 text-zinc-600 cursor-grab" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
