'use client';

import React from 'react';
import { Utensils, Flame, Plus, Minus, Calculator, Apple, Coffee, Soup, Cookie } from 'lucide-react';
import { DailyRecord } from '../types/fitness';

interface DietViewProps {
  selectedDate: string;
  isToday: boolean;
  record: DailyRecord;
  onUpdateRecord: (updatedRecord: DailyRecord) => void;
}

export const DietView: React.FC<DietViewProps> = ({
  selectedDate,
  isToday,
  record,
  onUpdateRecord,
}) => {
  const { tdee, intake, foodNotes } = record;
  const { breakfast, lunch, dinner, snacks } = intake;
  const notes = foodNotes || { breakfast: '', lunch: '', dinner: '', snacks: '' };

  const totalIntake = breakfast + lunch + dinner + snacks;
  const deficit = totalIntake - tdee;

  const handleFoodNoteChange = (meal: keyof typeof intake, val: string) => {
    onUpdateRecord({
      ...record,
      foodNotes: {
        breakfast: notes.breakfast,
        lunch: notes.lunch,
        dinner: notes.dinner,
        snacks: notes.snacks,
        [meal]: val,
      },
    });
  };

  const handleTdeeChange = (val: number) => {
    onUpdateRecord({
      ...record,
      tdee: Math.max(0, val),
    });
  };

  const handleMealChange = (meal: keyof typeof intake, val: number) => {
    onUpdateRecord({
      ...record,
      intake: {
        ...intake,
        [meal]: Math.max(0, val),
      },
    });
  };

  // Adjust calorie values by specific steps (+/-)
  const adjustMeal = (meal: keyof typeof intake, amount: number) => {
    const currentVal = intake[meal] || 0;
    handleMealChange(meal, currentVal + amount);
  };

  // Deficit badge styling
  const isDeficitAchieved = deficit < 0;
  const isNeutral = deficit === 0;
  
  const getBadgeStyles = () => {
    if (isNeutral) {
      return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
    return isDeficitAchieved
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]'
      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.05)]';
  };

  // Format the deficit text. e.g. -500 kcal or +350 kcal
  const formatDeficitText = () => {
    if (deficit > 0) return `+${deficit} kcal`;
    return `${deficit} kcal`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Calorie Balance Visualization Dashboard */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-3xl p-5 shadow-lg space-y-5">
        <div className="flex items-center space-x-2 border-b border-zinc-800/60 pb-3">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-zinc-300">熱量收支計算</h2>
        </div>

        {/* Big numbers summary */}
        <div className="grid grid-cols-3 gap-2 text-center py-2">
          <div className="flex flex-col justify-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">TDEE 消耗</span>
            <span className="text-lg font-bold font-mono text-zinc-200 mt-1">{tdee} <span className="text-[10px] font-normal text-zinc-500">kcal</span></span>
          </div>
          
          <div className="border-x border-zinc-850 flex flex-col justify-center px-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">總攝取量</span>
            <span className="text-lg font-bold font-mono text-zinc-200 mt-1">{totalIntake} <span className="text-[10px] font-normal text-zinc-500">kcal</span></span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">熱量缺口</span>
            <div className={`px-3 py-1.5 rounded-full text-sm font-bold font-mono ${getBadgeStyles()}`}>
              {formatDeficitText()}
            </div>
          </div>
        </div>

        {/* Minimal progress bar */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900/50">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                totalIntake <= tdee ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, tdee > 0 ? (totalIntake / tdee) * 100 : 0)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-zinc-500 font-mono px-0.5">
            <span>0%</span>
            <span>已攝取 {tdee > 0 ? Math.round((totalIntake / tdee) * 100) : 0}%</span>
            <span>TDEE (100%)</span>
          </div>
        </div>
      </div>

      {/* 2. TDEE Input Section */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="tdee-input" className="text-xs font-semibold text-zinc-400 flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span>每日總熱量消耗 TDEE (kcal)</span>
          </label>
          <input
            id="tdee-input"
            type="number"
            value={tdee || ''}
            onChange={(e) => handleTdeeChange(parseInt(e.target.value) || 0)}
            placeholder="例如 2000"
            className="w-24 text-right text-sm bg-zinc-950 border border-zinc-850 focus:border-emerald-500/50 rounded-xl px-3 py-1 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
          />
        </div>
      </div>

      {/* 3. Meal Inputs List */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-zinc-800/60 pb-3">
          <Utensils className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-zinc-300">飲食記錄 (kcal)</h2>
        </div>

        {/* Breakfast */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Coffee className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-300">早餐</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={breakfast || ''}
                onChange={(e) => handleMealChange('breakfast', parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-20 text-right text-sm bg-zinc-950 border border-zinc-850 focus:border-emerald-500/50 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none transition-all font-mono"
              />
              <span className="text-[10px] text-zinc-500 w-6">kcal</span>
            </div>
          </div>
          <div className="flex justify-between items-center gap-2">
            <input
              type="text"
              value={notes.breakfast || ''}
              onChange={(e) => handleFoodNoteChange('breakfast', e.target.value)}
              placeholder="食咗啲咩？"
              className="flex-1 text-xs bg-zinc-950/60 border border-zinc-850 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-lg px-2.5 py-1 text-zinc-300 placeholder-zinc-700 focus:outline-none transition-all"
            />
            <div className="flex space-x-1 shrink-0">
              <button onClick={() => adjustMeal('breakfast', 100)} className="px-2 py-0.5 rounded bg-zinc-800/50 text-[10px] text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-all">+100</button>
              <button onClick={() => adjustMeal('breakfast', 200)} className="px-2 py-0.5 rounded bg-zinc-800/50 text-[10px] text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-all">+200</button>
              <button onClick={() => adjustMeal('breakfast', -100)} className="px-2 py-0.5 rounded bg-zinc-800/50 text-[10px] text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-all">-100</button>
            </div>
          </div>
        </div>

        <hr className="border-zinc-850" />

        {/* Lunch */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                <Apple className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-300">午餐</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={lunch || ''}
                onChange={(e) => handleMealChange('lunch', parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-20 text-right text-sm bg-zinc-950 border border-zinc-850 focus:border-emerald-500/50 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none transition-all font-mono"
              />
              <span className="text-[10px] text-zinc-500 w-6">kcal</span>
            </div>
          </div>
          <div className="flex justify-between items-center gap-2">
            <input
              type="text"
              value={notes.lunch || ''}
              onChange={(e) => handleFoodNoteChange('lunch', e.target.value)}
              placeholder="食咗啲咩？"
              className="flex-1 text-xs bg-zinc-950/60 border border-zinc-850 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-lg px-2.5 py-1 text-zinc-300 placeholder-zinc-700 focus:outline-none transition-all"
            />
            <div className="flex space-x-1 shrink-0">
              <button onClick={() => adjustMeal('lunch', 100)} className="px-2 py-0.5 rounded bg-zinc-800/50 text-[10px] text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-all">+100</button>
              <button onClick={() => adjustMeal('lunch', 300)} className="px-2 py-0.5 rounded bg-zinc-800/50 text-[10px] text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-all">+300</button>
              <button onClick={() => adjustMeal('lunch', -100)} className="px-2 py-0.5 rounded bg-zinc-800/50 text-[10px] text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-all">-100</button>
            </div>
          </div>
        </div>

        <hr className="border-zinc-850" />

        {/* Dinner */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                <Soup className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-300">晚餐</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={dinner || ''}
                onChange={(e) => handleMealChange('dinner', parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-20 text-right text-sm bg-zinc-950 border border-zinc-850 focus:border-emerald-500/50 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none transition-all font-mono"
              />
              <span className="text-[10px] text-zinc-500 w-6">kcal</span>
            </div>
          </div>
          <div className="flex justify-between items-center gap-2">
            <input
              type="text"
              value={notes.dinner || ''}
              onChange={(e) => handleFoodNoteChange('dinner', e.target.value)}
              placeholder="食咗啲咩？"
              className="flex-1 text-xs bg-zinc-950/60 border border-zinc-850 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-lg px-2.5 py-1 text-zinc-300 placeholder-zinc-700 focus:outline-none transition-all"
            />
            <div className="flex space-x-1 shrink-0">
              <button onClick={() => adjustMeal('dinner', 100)} className="px-2 py-0.5 rounded bg-zinc-800/50 text-[10px] text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-all">+100</button>
              <button onClick={() => adjustMeal('dinner', 300)} className="px-2 py-0.5 rounded bg-zinc-800/50 text-[10px] text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-all">+300</button>
              <button onClick={() => adjustMeal('dinner', -100)} className="px-2 py-0.5 rounded bg-zinc-800/50 text-[10px] text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-all">-100</button>
            </div>
          </div>
        </div>

        <hr className="border-zinc-850" />

        {/* Snacks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
                <Cookie className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-300">零食 / 其它</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={snacks || ''}
                onChange={(e) => handleMealChange('snacks', parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-20 text-right text-sm bg-zinc-950 border border-zinc-850 focus:border-emerald-500/50 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none transition-all font-mono"
              />
              <span className="text-[10px] text-zinc-500 w-6">kcal</span>
            </div>
          </div>
          <div className="flex justify-between items-center gap-2">
            <input
              type="text"
              value={notes.snacks || ''}
              onChange={(e) => handleFoodNoteChange('snacks', e.target.value)}
              placeholder="食咗啲咩？"
              className="flex-1 text-xs bg-zinc-950/60 border border-zinc-850 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-lg px-2.5 py-1 text-zinc-300 placeholder-zinc-700 focus:outline-none transition-all"
            />
            <div className="flex space-x-1 shrink-0">
              <button onClick={() => adjustMeal('snacks', 50)} className="px-2 py-0.5 rounded bg-zinc-800/50 text-[10px] text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-all">+50</button>
              <button onClick={() => adjustMeal('snacks', 100)} className="px-2 py-0.5 rounded bg-zinc-800/50 text-[10px] text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-all">+100</button>
              <button onClick={() => adjustMeal('snacks', -50)} className="px-2 py-0.5 rounded bg-zinc-800/50 text-[10px] text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-all">-50</button>
            </div>
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
