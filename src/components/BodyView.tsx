'use client';

import React, { useState } from 'react';
import { Scale, ClipboardPaste, Check, Sparkles, Ruler } from 'lucide-react';
import { DailyRecord } from '../types/fitness';

interface BodyViewProps {
  selectedDate: string;
  isToday: boolean;
  record: DailyRecord;
  onUpdateRecord: (updatedRecord: DailyRecord) => void;
}

export const BodyView: React.FC<BodyViewProps> = ({
  selectedDate,
  isToday,
  record,
  onUpdateRecord,
}) => {
  const body = record.body || { weight: null, bodyFat: null, muscle: null };
  const measurements = record.measurements || { waist: 0, thigh: 0 };
  const [pasteText, setPasteText] = useState('');
  const [flashSuccess, setFlashSuccess] = useState(false);

  const handleMeasurementChange = (field: 'waist' | 'thigh', val: string) => {
    const numVal = val === '' ? 0 : parseFloat(val) || 0;
    onUpdateRecord({
      ...record,
      measurements: {
        waist: measurements.waist,
        thigh: measurements.thigh,
        [field]: numVal,
      },
    });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPasteText(text);

    // OMRON Regex Parsers
    const weightMatch = text.match(/体重\s*([\d.]+)\s*kg/);
    const bodyFatMatch = text.match(/体脂肪率\s*([\d.]+)\s*%/);
    const muscleMatch = text.match(/骨格筋率\s*([\d.]+)\s*%/);

    const updatedBody = {
      weight: body.weight,
      bodyFat: body.bodyFat,
      muscle: body.muscle,
    };

    let parsedAny = false;

    if (weightMatch && weightMatch[1]) {
      updatedBody.weight = parseFloat(weightMatch[1]) || null;
      parsedAny = true;
    }
    if (bodyFatMatch && bodyFatMatch[1]) {
      updatedBody.bodyFat = parseFloat(bodyFatMatch[1]) || null;
      parsedAny = true;
    }
    if (muscleMatch && muscleMatch[1]) {
      updatedBody.muscle = parseFloat(muscleMatch[1]) || null;
      parsedAny = true;
    }

    if (parsedAny) {
      onUpdateRecord({
        ...record,
        body: updatedBody,
      });
      // Clear the textarea after successful parsing
      setPasteText('');
      // Show success feedback
      setFlashSuccess(true);
      setTimeout(() => setFlashSuccess(false), 2000);
    }
  };

  const handleFieldChange = (field: 'weight' | 'bodyFat' | 'muscle', val: string) => {
    const numVal = val === '' ? null : parseFloat(val);
    onUpdateRecord({
      ...record,
      body: {
        ...body,
        [field]: numVal,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Smart Paste Card */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-3xl p-5 shadow-lg space-y-4 relative overflow-hidden">
        {/* Glow effect */}
        {flashSuccess && (
          <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none transition-all duration-300 border border-emerald-500/20 rounded-3xl animate-pulse" />
        )}
        
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
          <div className="flex items-center space-x-2">
            <ClipboardPaste className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-zinc-300">智能解析 (從 OMRON 截圖複製文字貼上)</h2>
          </div>
          {flashSuccess && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center space-x-1">
              <Check className="w-3 h-3" />
              <span>解析成功</span>
            </span>
          )}
        </div>

        <div className="space-y-3">
          <textarea
            value={pasteText}
            onChange={handleTextChange}
            placeholder="請在此貼上從 OMRON 體脂磅 App 截圖中複製的辨識文字...&#10;(例如: 体重 65.4 kg  体脂肪率 15.3 %  骨格筋率 38.2 %)"
            rows={3}
            className="w-full text-xs bg-zinc-950 border border-zinc-850 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-3.5 py-3 text-zinc-200 placeholder-zinc-700 focus:outline-none transition-all resize-none font-sans leading-relaxed"
          />
          <p className="text-[10px] text-zinc-500 leading-normal flex items-start space-x-1.5 px-0.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>貼上後，系統會自動提取 <b>体重 (kg)</b>、<b>体脂肪率 (%)</b> 及 <b>骨格筋率 (%)</b> 的數據並自動清除輸入框。</span>
          </p>
        </div>
      </div>

      {/* 2. Manual Inputs Card */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-3xl p-5 shadow-lg space-y-5">
        <div className="flex items-center space-x-2 border-b border-zinc-800/60 pb-3">
          <Scale className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-zinc-300">體成份記錄 (磅重)</h2>
        </div>

        <div className="space-y-4">
          {/* Weight */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-400">體重 (Weight)</label>
              <span className="text-xs font-bold text-zinc-500 font-mono">kg</span>
            </div>
            <input
              type="number"
              step="0.1"
              value={body.weight ?? ''}
              onChange={(e) => handleFieldChange('weight', e.target.value)}
              placeholder="例如 68.5"
              className="w-full text-sm bg-zinc-950 border border-zinc-850 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none transition-all font-mono placeholder-zinc-750"
            />
          </div>

          {/* Body Fat */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-400">體脂肪率 (Body Fat)</label>
              <span className="text-xs font-bold text-zinc-500 font-mono">%</span>
            </div>
            <input
              type="number"
              step="0.1"
              value={body.bodyFat ?? ''}
              onChange={(e) => handleFieldChange('bodyFat', e.target.value)}
              placeholder="例如 16.2"
              className="w-full text-sm bg-zinc-950 border border-zinc-850 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none transition-all font-mono placeholder-zinc-750"
            />
          </div>

          {/* Skeletal Muscle */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-400">骨骼肌率 (Skeletal Muscle)</label>
              <span className="text-xs font-bold text-zinc-500 font-mono">%</span>
            </div>
            <input
              type="number"
              step="0.1"
              value={body.muscle ?? ''}
              onChange={(e) => handleFieldChange('muscle', e.target.value)}
              placeholder="例如 38.5"
              className="w-full text-sm bg-zinc-950 border border-zinc-850 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none transition-all font-mono placeholder-zinc-750"
            />
          </div>
        </div>
      </div>

      {/* 3. Body Measurements Card */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-zinc-800/60 pb-3">
          <Ruler className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-zinc-300">身體尺寸紀錄</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400">腰圍 (cm)</label>
            <input
              type="number"
              step="0.1"
              value={measurements.waist || ''}
              onChange={(e) => handleMeasurementChange('waist', e.target.value)}
              placeholder="例如 75.5"
              className="w-full text-sm bg-zinc-950 border border-zinc-850 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none transition-all font-mono placeholder-zinc-750"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400">大腿圍 (cm)</label>
            <input
              type="number"
              step="0.1"
              value={measurements.thigh || ''}
              onChange={(e) => handleMeasurementChange('thigh', e.target.value)}
              placeholder="例如 52.0"
              className="w-full text-sm bg-zinc-950 border border-zinc-850 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none transition-all font-mono placeholder-zinc-750"
            />
          </div>
        </div>
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
