'use client';

import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Dumbbell, Utensils, Edit3, Award, Flame, AlertCircle, Ruler, Scale } from 'lucide-react';
import { DailyRecord, DailyRecords } from '../types/fitness';
import { TrendChart } from './TrendChart';

interface StatsViewProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  records: DailyRecords;
  setTab: (tab: string) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  selectedDate,
  setSelectedDate,
  records,
  setTab,
}) => {
  // Local state to track which month/year the calendar is displaying
  // Initialized to the month of the selectedDate
  const [currentYear, setCurrentYear] = useState<number>(() => {
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth();
  });

  const monthsChinese = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  // Go to previous month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Go to next month
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Calculate calendar days
  const calendarCells = useMemo(() => {
    // First day of the month
    const firstDay = new Date(currentYear, currentMonth, 1);
    // Total days in the month
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Weekday of the first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Standardize weekday offset so Monday is index 0
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const cells = [];

    // 1. Padding days from the previous month
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDay = prevMonthTotalDays - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const dateStr = `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}-${prevDay.toString().padStart(2, '0')}`;
      cells.push({
        day: prevDay,
        dateString: dateStr,
        isCurrentMonth: false,
      });
    }

    // 2. Active month days
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      cells.push({
        day,
        dateString: dateStr,
        isCurrentMonth: true,
      });
    }

    // 3. Padding days from the next month to complete the grid (up to 42 cells)
    const totalGridCells = cells.length > 35 ? 42 : 35;
    const nextMonthDaysNeeded = totalGridCells - cells.length;
    for (let day = 1; day <= nextMonthDaysNeeded; day++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      
      const dateStr = `${nextYear}-${(nextMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      cells.push({
        day,
        dateString: dateStr,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Calculate Monthly Statistics for the displayed month
  const stats = useMemo(() => {
    let workoutDaysCount = 0;
    let netCalorieDeficit = 0;
    let hasDietRecords = false;

    // Filter records that match current year and month (YYYY-MM-DD)
    const monthPrefix = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;

    Object.keys(records).forEach((dateKey) => {
      if (dateKey.startsWith(monthPrefix)) {
        const record = records[dateKey];
        
        // Workout Stats
        if (record.workout?.didWorkout) {
          workoutDaysCount++;
        }

        // Calorie Stats
        const intake = record.intake;
        if (intake) {
          const totalIntake = (intake.breakfast || 0) + (intake.lunch || 0) + (intake.dinner || 0) + (intake.snacks || 0);
          // Only calculate deficit if they actually logged calories (>0)
          if (totalIntake > 0) {
            const dailyDeficit = totalIntake - (record.tdee || 0);
            netCalorieDeficit += dailyDeficit;
            hasDietRecords = true;
          }
        }
      }
    });

    return {
      workoutDaysCount,
      netCalorieDeficit,
      hasDietRecords,
    };
  }, [records, currentYear, currentMonth]);

  // Calculate Weekly Statistics for the week containing selectedDate (Monday to Sunday)
  const weeklyStats = useMemo(() => {
    const date = new Date(selectedDate);
    if (isNaN(date.getTime())) {
      return {
        workoutDaysCount: 0,
        netCalorieDeficit: 0,
        hasDietRecords: false,
      };
    }

    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const day = date.getDay();
    // Calculate offset to Monday (if Sunday (0), offset is -6. Otherwise, it is 1 - day)
    const diffToMonday = day === 0 ? -6 : 1 - day;
    
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);

    let workoutDaysCount = 0;
    let netCalorieDeficit = 0;
    let hasDietRecords = false;

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);
      const yyyy = currentDay.getFullYear();
      const mm = (currentDay.getMonth() + 1).toString().padStart(2, '0');
      const dd = currentDay.getDate().toString().padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const record = records[dateStr];
      if (record) {
        if (record.workout?.didWorkout) {
          workoutDaysCount++;
        }
        const intake = record.intake;
        if (intake) {
          const totalIntake = (intake.breakfast || 0) + (intake.lunch || 0) + (intake.dinner || 0) + (intake.snacks || 0);
          if (totalIntake > 0) {
            const dailyDeficit = totalIntake - (record.tdee || 0);
            netCalorieDeficit += dailyDeficit;
            hasDietRecords = true;
          }
        }
      }
    }

    return {
      workoutDaysCount,
      netCalorieDeficit,
      hasDietRecords,
    };
  }, [records, selectedDate]);

  // Selected Day Summary helper values
  const selectedDayRecord = records[selectedDate] || {
    date: selectedDate,
    tdee: 2000,
    intake: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 },
    workout: { didWorkout: false, duration: 0, description: '' },
  };

  const selectedDayTotalIntake = 
    selectedDayRecord.intake.breakfast + 
    selectedDayRecord.intake.lunch + 
    selectedDayRecord.intake.dinner + 
    selectedDayRecord.intake.snacks;
    
  const selectedDayDeficit = selectedDayTotalIntake - selectedDayRecord.tdee;
  const isSelectedDeficitAchieved = selectedDayDeficit < 0;

  return (
    <div className="space-y-6">
      {/* 1. Monthly Calendar Grid */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-3xl p-5 shadow-lg space-y-4">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-zinc-300">
              {currentYear}年 {monthsChinese[currentMonth]}
            </h2>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekdays Headers */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
            <span key={day} className="text-[10px] font-bold text-zinc-500 py-1">
              {day}
            </span>
          ))}
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarCells.map((cell, idx) => {
            const isSelected = cell.dateString === selectedDate;
            const record = records[cell.dateString];
            
            // Check workout dot condition
            const hasWorkoutDot = record?.workout?.didWorkout;
            
            // Check diet dot condition
            let hasDietDot = false;
            if (record?.intake) {
              const totalIntake = 
                (record.intake.breakfast || 0) + 
                (record.intake.lunch || 0) + 
                (record.intake.dinner || 0) + 
                (record.intake.snacks || 0);
              const dailyDeficit = totalIntake - (record.tdee || 0);
              hasDietDot = totalIntake > 0 && dailyDeficit < 0;
            }

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(cell.dateString)}
                className={`py-2 flex flex-col items-center justify-between h-12 rounded-xl transition-all relative ${
                  cell.isCurrentMonth ? 'text-zinc-200' : 'text-zinc-650'
                } ${
                  isSelected 
                    ? 'bg-white text-zinc-950 font-black shadow-md border-0 scale-105 z-10' 
                    : 'hover:bg-zinc-800/40 active:scale-95'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Day number */}
                <span className="text-xs font-semibold">{cell.day}</span>

                {/* Indicator dots container */}
                <div className="flex space-x-0.5 justify-center items-center h-2.5">
                  {hasWorkoutDot && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-blue-400'}`} />
                  )}
                  {hasDietDot && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-600' : 'bg-emerald-400'}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Trend Chart */}
      <TrendChart records={records} selectedDate={selectedDate} />

      {/* 3. Stats Summary */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-300">數據統計摘要</h2>
          </div>
        </div>

        {/* Monthly section */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-400 flex items-center space-x-1">
            <span className="w-1.5 h-3 bg-blue-500 rounded-full" />
            <span>{currentMonth + 1}月 月度累計</span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-2xl flex flex-col space-y-1">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">累計訓練</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-bold text-zinc-200">{stats.workoutDaysCount}</span>
                <span className="text-xs text-zinc-500">天</span>
              </div>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-2xl flex flex-col space-y-1">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">累計熱量缺口</span>
              <div className="flex items-baseline space-x-0.5">
                {stats.hasDietRecords ? (
                  <>
                    <span className={`text-base font-bold font-mono ${stats.netCalorieDeficit <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stats.netCalorieDeficit > 0 ? `+${stats.netCalorieDeficit}` : stats.netCalorieDeficit}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">kcal</span>
                  </>
                ) : (
                  <span className="text-xs text-zinc-550 font-semibold">無熱量紀錄</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly section */}
        <div className="space-y-2 pt-3 border-t border-zinc-850/60">
          <h3 className="text-xs font-bold text-zinc-400 flex items-center space-x-1">
            <span className="w-1.5 h-3 bg-emerald-500 rounded-full" />
            <span>本週累計 (包含選中日 {selectedDate})</span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-2xl flex flex-col space-y-1">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">本週訓練</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-bold text-zinc-200">{weeklyStats.workoutDaysCount}</span>
                <span className="text-xs text-zinc-500">天</span>
              </div>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-2xl flex flex-col space-y-1">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">本週熱量缺口</span>
              <div className="flex items-baseline space-x-0.5">
                {weeklyStats.hasDietRecords ? (
                  <>
                    <span className={`text-base font-bold font-mono ${weeklyStats.netCalorieDeficit <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {weeklyStats.netCalorieDeficit > 0 ? `+${weeklyStats.netCalorieDeficit}` : weeklyStats.netCalorieDeficit}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">kcal</span>
                  </>
                ) : (
                  <span className="text-xs text-zinc-550 font-semibold">無熱量紀錄</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Single-Day Details Summary */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex justify-between items-center border-b border-zinc-800/60 pb-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-semibold text-zinc-300">
              {selectedDate} 日誌摘要
            </h2>
          </div>
        </div>

        {/* Workout section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-zinc-400">
              <Dumbbell className="w-4 h-4 text-blue-400" />
              <span>健身房訓練</span>
            </div>
            {selectedDayRecord.workout?.didWorkout ? (
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold text-[10px]">
                已完成 ({selectedDayRecord.workout.duration} 分鐘)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 font-bold text-[10px]">
                無訓練
              </span>
            )}
          </div>
          
          {selectedDayRecord.workout?.didWorkout && selectedDayRecord.workout.description && (
            <div className="p-2.5 bg-zinc-950/50 rounded-xl text-xs text-zinc-300 border border-zinc-900">
              <p className="font-semibold text-zinc-400 text-[10px] mb-1">訓練備註：</p>
              <p className="leading-relaxed">{selectedDayRecord.workout.description}</p>
            </div>
          )}
        </div>

        <hr className="border-zinc-850" />

        {/* Diet section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-zinc-400">
              <Utensils className="w-4 h-4 text-emerald-400" />
              <span>飲食與熱量</span>
            </div>
            {selectedDayTotalIntake > 0 ? (
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                selectedDayDeficit < 0 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : selectedDayDeficit > 0 
                    ? 'bg-rose-500/10 text-rose-400' 
                    : 'bg-zinc-850 text-zinc-400'
              }`}>
                {selectedDayDeficit > 0 ? `+${selectedDayDeficit}` : selectedDayDeficit} kcal
              </div>
            ) : (
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 font-bold text-[10px]">
                無飲食紀錄
              </span>
            )}
          </div>

          {selectedDayTotalIntake > 0 && (
            <div className="p-2.5 bg-zinc-950/50 rounded-xl border border-zinc-900 space-y-2">
              {/* Meals breakdown table/grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-zinc-400">
                <div className="flex flex-col space-y-0.5 border-b border-zinc-900/50 pb-1">
                  <div className="flex justify-between font-semibold">
                    <span>早餐：</span>
                    <span className="font-mono text-zinc-300">{selectedDayRecord.intake.breakfast} kcal</span>
                  </div>
                  {selectedDayRecord.foodNotes?.breakfast && (
                    <span className="text-zinc-550 text-[9px] leading-tight truncate" title={selectedDayRecord.foodNotes.breakfast}>
                      {selectedDayRecord.foodNotes.breakfast}
                    </span>
                  )}
                </div>
                <div className="flex flex-col space-y-0.5 border-b border-zinc-900/50 pb-1">
                  <div className="flex justify-between font-semibold">
                    <span>午餐：</span>
                    <span className="font-mono text-zinc-300">{selectedDayRecord.intake.lunch} kcal</span>
                  </div>
                  {selectedDayRecord.foodNotes?.lunch && (
                    <span className="text-zinc-550 text-[9px] leading-tight truncate" title={selectedDayRecord.foodNotes.lunch}>
                      {selectedDayRecord.foodNotes.lunch}
                    </span>
                  )}
                </div>
                <div className="flex flex-col space-y-0.5 border-b border-zinc-900/50 pb-1">
                  <div className="flex justify-between font-semibold">
                    <span>晚餐：</span>
                    <span className="font-mono text-zinc-300">{selectedDayRecord.intake.dinner} kcal</span>
                  </div>
                  {selectedDayRecord.foodNotes?.dinner && (
                    <span className="text-zinc-550 text-[9px] leading-tight truncate" title={selectedDayRecord.foodNotes.dinner}>
                      {selectedDayRecord.foodNotes.dinner}
                    </span>
                  )}
                </div>
                <div className="flex flex-col space-y-0.5 border-b border-zinc-900/50 pb-1">
                  <div className="flex justify-between font-semibold">
                    <span>零食：</span>
                    <span className="font-mono text-zinc-300">{selectedDayRecord.intake.snacks} kcal</span>
                  </div>
                  {selectedDayRecord.foodNotes?.snacks && (
                    <span className="text-zinc-550 text-[9px] leading-tight truncate" title={selectedDayRecord.foodNotes.snacks}>
                      {selectedDayRecord.foodNotes.snacks}
                    </span>
                  )}
                </div>
              </div>
              <div className="border-t border-zinc-900/80 pt-1.5 flex justify-between text-[10px] font-bold">
                <span className="text-zinc-500">總攝取 / TDEE：</span>
                <span className="text-zinc-300 font-mono">
                  {selectedDayTotalIntake} / {selectedDayRecord.tdee} kcal
                </span>
              </div>
            </div>
          )}
        </div>

        <hr className="border-zinc-850" />

        {/* Body Measurements section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-zinc-400">
              <Ruler className="w-4 h-4 text-purple-400" />
              <span>身體尺寸紀錄</span>
            </div>
            {(selectedDayRecord.measurements?.waist || selectedDayRecord.measurements?.thigh) ? (
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold text-[10px]">
                已紀錄
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 font-bold text-[10px]">
                無尺寸紀錄
              </span>
            )}
          </div>
          
          {(selectedDayRecord.measurements?.waist || selectedDayRecord.measurements?.thigh) ? (
            <div className="grid grid-cols-2 gap-4 p-2.5 bg-zinc-950/50 rounded-xl border border-zinc-900 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-550 font-medium">腰圍：</span>
                <span className="font-mono text-zinc-200 font-bold">
                  {selectedDayRecord.measurements?.waist ? `${selectedDayRecord.measurements.waist} cm` : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-550 font-medium">大腿圍：</span>
                <span className="font-mono text-zinc-200 font-bold">
                  {selectedDayRecord.measurements?.thigh ? `${selectedDayRecord.measurements.thigh} cm` : '--'}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <hr className="border-zinc-850" />

        {/* Body composition section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-zinc-400">
              <Scale className="w-4 h-4 text-blue-400" />
              <span>體成份紀錄 (磅重)</span>
            </div>
            {(selectedDayRecord.body?.weight || selectedDayRecord.body?.bodyFat || selectedDayRecord.body?.muscle) ? (
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold text-[10px]">
                已磅重
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 font-bold text-[10px]">
                無磅重紀錄
              </span>
            )}
          </div>

          {(selectedDayRecord.body?.weight || selectedDayRecord.body?.bodyFat || selectedDayRecord.body?.muscle) ? (
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-zinc-950/50 rounded-xl border border-zinc-900 text-xs">
              <div className="flex flex-col items-center justify-center p-1.5 bg-zinc-900/30 rounded-lg">
                <span className="text-zinc-550 text-[9px] mb-0.5 font-medium">體重</span>
                <span className="font-mono text-zinc-200 font-bold">
                  {selectedDayRecord.body.weight ? `${selectedDayRecord.body.weight} kg` : '--'}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-1.5 bg-zinc-900/30 rounded-lg">
                <span className="text-zinc-550 text-[9px] mb-0.5 font-medium">體脂率</span>
                <span className="font-mono text-zinc-200 font-bold">
                  {selectedDayRecord.body.bodyFat ? `${Math.round(Number(selectedDayRecord.body.bodyFat) * 10) / 10}%` : '--'}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-1.5 bg-zinc-900/30 rounded-lg">
                <span className="text-zinc-550 text-[9px] mb-0.5 font-medium">骨骼肌率</span>
                <span className="font-mono text-zinc-200 font-bold">
                  {selectedDayRecord.body.muscle ? `${Math.round(Number(selectedDayRecord.body.muscle) * 10) / 10}%` : '--'}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Action Button to switch views and edit */}
        <div className="pt-2 grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setTab('workout')}
            className="py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-750 text-[10px] font-semibold text-zinc-300 hover:text-white transition-all flex items-center justify-center space-x-1 active:scale-95 cursor-pointer animate-press"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-400" />
            <span>編輯訓練</span>
          </button>
          <button
            onClick={() => setTab('diet')}
            className="py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-750 text-[10px] font-semibold text-zinc-300 hover:text-white transition-all flex items-center justify-center space-x-1 active:scale-95 cursor-pointer animate-press"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>編輯飲食</span>
          </button>
          <button
            onClick={() => setTab('body')}
            className="py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-750 text-[10px] font-semibold text-zinc-300 hover:text-white transition-all flex items-center justify-center space-x-1 active:scale-95 cursor-pointer animate-press"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>編輯磅重</span>
          </button>
        </div>
      </div>
    </div>
  );
};
