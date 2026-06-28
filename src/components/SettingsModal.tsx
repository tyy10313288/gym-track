'use client';

import React, { useState } from 'react';
import { X, Link, Copy, Check, Info, RefreshCw, Upload, Download, ShieldCheck, Database } from 'lucide-react';
import { DailyRecords } from '../types/fitness';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  webAppUrl: string;
  onSaveUrl: (url: string) => void;
  records: DailyRecords;
  onSyncPush: () => Promise<boolean>;
  onSyncPull: () => Promise<boolean>;
  lastSyncedAt: string | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  webAppUrl,
  onSaveUrl,
  records,
  onSyncPush,
  onSyncPull,
  lastSyncedAt,
}) => {
  const [urlInput, setUrlInput] = useState(webAppUrl);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMsg, setSyncMsg] = useState('');

  const APPS_SCRIPT_CODE = `// 貼上到 Google Apps Script 的程式碼
function doGet(e) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = doc.getSheets();
  var allRecords = {};
  
  // 1. 先讀取所有的月度分頁，解析飲食和訓練數據
  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var sheetName = sheet.getName();
    // 解析格式為 YYYY-MM (例如 "2026-06")、N月 (例如 "6月") 或 FitnessRecords 的分頁
    if (/^\\d{4}-\\d{2}$/.test(sheetName) || /^\\d{1,2}月$/.test(sheetName) || sheetName === "FitnessRecords") {
      var rows = sheet.getDataRange().getValues();
      if (rows.length > 1) {
        for (var i = 1; i < rows.length; i++) {
          var row = rows[i];
          var dateStr = row[0];
          if (dateStr) {
            dateStr = normalizeDateStr(dateStr, sheetName);
            allRecords[dateStr] = {
              date: dateStr,
              tdee: Number(row[1]) || 2000,
              intake: {
                breakfast: Number(row[2]) || 0,
                lunch: Number(row[4]) || 0,
                dinner: Number(row[6]) || 0,
                snacks: Number(row[8]) || 0
              },
              foodNotes: {
                breakfast: String(row[3]) || "",
                lunch: String(row[5]) || "",
                dinner: String(row[7]) || "",
                snacks: String(row[9]) || ""
              },
              workout: {
                didWorkout: String(row[14]) === "是",
                duration: Number(row[15]) || 0,
                description: String(row[16]) || ""
              }
            };
          }
        }
      }
    }
  }

  // 2. 讀取獨立的「磅重紀錄」分頁，合併體重等數據
  var weightSheet = doc.getSheetByName("磅重紀錄");
  if (weightSheet) {
    var rows = weightSheet.getDataRange().getValues();
    if (rows.length > 1) {
      for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        var dateStr = row[0];
        if (dateStr) {
          dateStr = normalizeDateStr(dateStr, "磅重紀錄");
          if (!allRecords[dateStr]) {
            allRecords[dateStr] = {
              date: dateStr,
              tdee: 2000,
              intake: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 },
              workout: { didWorkout: false, duration: 0, description: "" }
            };
          }
          allRecords[dateStr].body = {
            weight: row[1] !== "" && !isNaN(Number(row[1])) ? Number(row[1]) : null,
            bodyFat: row[2] !== "" && !isNaN(Number(row[2])) ? (Number(row[2]) > 1 ? Number(row[2]) : Math.round(Number(row[2]) * 1000) / 10) : null,
            muscle: row[3] !== "" && !isNaN(Number(row[3])) ? (Number(row[3]) > 1 ? Number(row[3]) : Math.round(Number(row[3]) * 1000) / 10) : null
          };
          allRecords[dateStr].measurements = {
            waist: row[4] !== "" && !isNaN(Number(row[4])) ? Number(row[4]) : 0,
            thigh: row[5] !== "" && !isNaN(Number(row[5])) ? Number(row[5]) : 0
          };
        }
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(allRecords))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var params = JSON.parse(e.postData.contents);
  var newRecords = params.records; // 傳入的 DailyRecords 物件
  
  // 按月份 (YYYY-MM) 將紀錄分組，用來寫入月度分頁
  var newRecordsByMonth = {};
  Object.keys(newRecords).forEach(function(date) {
    var month = date.substring(0, 7); // 取得 "YYYY-MM"
    if (!newRecordsByMonth[month]) {
      newRecordsByMonth[month] = {};
    }
    newRecordsByMonth[month][date] = newRecords[date];
  });
  
  // 處理各個月份的飲食與訓練數據分頁
  Object.keys(newRecordsByMonth).forEach(function(month) {
    var sheet = doc.getSheetByName(month);
    var existingRecords = {};
    
    // 如果分頁已存在，先讀取並整合舊有數據
    if (sheet) {
      var rows = sheet.getDataRange().getValues();
      if (rows.length > 1) {
        for (var i = 1; i < rows.length; i++) {
          var row = rows[i];
          var dateStr = row[0];
          if (dateStr) {
            dateStr = normalizeDateStr(dateStr, month);
            existingRecords[dateStr] = {
              date: dateStr,
              tdee: Number(row[1]) || 2000,
              intake: {
                breakfast: Number(row[2]) || 0,
                lunch: Number(row[4]) || 0,
                dinner: Number(row[6]) || 0,
                snacks: Number(row[8]) || 0
              },
              foodNotes: {
                breakfast: String(row[3]) || "",
                lunch: String(row[5]) || "",
                dinner: String(row[7]) || "",
                snacks: String(row[9]) || ""
              },
              workout: {
                didWorkout: String(row[14]) === "是",
                duration: Number(row[15]) || 0,
                description: String(row[16]) || ""
              }
            };
          }
        }
      }
    } else {
      // 不存在則新建該月份分頁
      sheet = doc.insertSheet(month);
    }
    
    // 整合數據：用新上傳的覆蓋或新增到舊紀錄中
    var monthNewRecs = newRecordsByMonth[month];
    Object.keys(monthNewRecs).forEach(function(date) {
      existingRecords[date] = monthNewRecs[date];
    });
    
    // 重新排序並寫入分頁
    sheet.clear();
    sheet.appendRow([
      "日期 (Date)", "TDEE", 
      "早餐熱量 (kcal)", "早餐食物", 
      "午餐熱量 (kcal)", "午餐食物", 
      "晚餐熱量 (kcal)", "晚餐食物", 
      "零食熱量 (kcal)", "零食食物", 
      "總攝取量 (kcal)", "熱量缺口 (kcal)", 
      "本週累計熱量缺口 (kcal)", "本月累計熱量缺口 (kcal)",
      "今日訓練", "訓練時長 (分鐘)", "訓練備忘"
    ]);
    
    var sortedDates = Object.keys(existingRecords).sort();
    for (var i = 0; i < sortedDates.length; i++) {
      var date = sortedDates[i];
      var rec = existingRecords[date];
      var breakfast = rec.intake?.breakfast || 0;
      var lunch = rec.intake?.lunch || 0;
      var dinner = rec.intake?.dinner || 0;
      var snacks = rec.intake?.snacks || 0;
      var totalIntake = breakfast + lunch + dinner + snacks;
      var deficit = totalIntake - rec.tdee;
      var weekMonthDeficits = getWeekRangeAndMonthDeficits(date, existingRecords);
      
      sheet.appendRow([
        date,
        rec.tdee,
        breakfast,
        rec.foodNotes?.breakfast || "",
        lunch,
        rec.foodNotes?.lunch || "",
        dinner,
        rec.foodNotes?.dinner || "",
        snacks,
        rec.foodNotes?.snacks || "",
        totalIntake,
        deficit,
        weekMonthDeficits.weekly,
        weekMonthDeficits.monthly,
        rec.workout?.didWorkout ? "是" : "否",
        rec.workout?.duration || 0,
        rec.workout?.description || ""
      ]);
    }
  });

  // 處理獨立的「磅重紀錄」分頁
  var weightSheet = doc.getSheetByName("磅重紀錄");
  var existingBodyRecords = {};
  
  if (weightSheet) {
    var rows = weightSheet.getDataRange().getValues();
    if (rows.length > 1) {
      for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        var dateStr = row[0];
        if (dateStr) {
          dateStr = normalizeDateStr(dateStr, "磅重紀錄");
          existingBodyRecords[dateStr] = {
            weight: row[1] !== "" ? Number(row[1]) : null,
            bodyFat: row[2] !== "" ? (Number(row[2]) > 1 ? Number(row[2]) : Math.round(Number(row[2]) * 1000) / 10) : null,
            muscle: row[3] !== "" ? (Number(row[3]) > 1 ? Number(row[3]) : Math.round(Number(row[3]) * 1000) / 10) : null,
            waist: row[4] !== "" && !isNaN(Number(row[4])) ? Number(row[4]) : 0,
            thigh: row[5] !== "" && !isNaN(Number(row[5])) ? Number(row[5]) : 0
          };
        }
      }
    }
  } else {
    weightSheet = doc.insertSheet("磅重紀錄");
  }

  // 整合新上傳的體成份紀錄
  Object.keys(newRecords).forEach(function(date) {
    var rec = newRecords[date];
    var hasBody = rec.body && (rec.body.weight !== null || rec.body.bodyFat !== null || rec.body.muscle !== null);
    var hasMeas = rec.measurements && (rec.measurements.waist || rec.measurements.thigh);
    
    if (hasBody || hasMeas) {
      existingBodyRecords[date] = {
        weight: rec.body?.weight ?? null,
        bodyFat: rec.body?.bodyFat ?? null,
        muscle: rec.body?.muscle ?? null,
        waist: rec.measurements?.waist || 0,
        thigh: rec.measurements?.thigh || 0
      };
    } else if (existingBodyRecords[date]) {
      // 如果新紀錄中這天被清空了，則從列表移除
      delete existingBodyRecords[date];
    }
  });

  // 重新排序並寫入「磅重紀錄」
  weightSheet.clear();
  weightSheet.appendRow(["日期 (Date)", "體重 (kg)", "體脂肪率 (%)", "骨骼肌率 (%)", "腰圍 (cm)", "大腿圍 (cm)"]);
  
  var sortedBodyDates = Object.keys(existingBodyRecords).sort();
  for (var i = 0; i < sortedBodyDates.length; i++) {
    var date = sortedBodyDates[i];
    var body = existingBodyRecords[date];
    weightSheet.appendRow([
      date,
      body.weight !== null && body.weight !== undefined ? body.weight : "",
      body.bodyFat !== null && body.bodyFat !== undefined ? body.bodyFat / 100 : "",
      body.muscle !== null && body.muscle !== undefined ? body.muscle / 100 : "",
      body.waist || "",
      body.thigh || ""
    ]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 輔助函數：計算特定日期所在的週（週一至週日）以及當月累計熱量缺口
function getWeekRangeAndMonthDeficits(targetDateStr, allRecs) {
  var parts = targetDateStr.split('-');
  var year = Number(parts[0]);
  var month = Number(parts[1]) - 1;
  var day = Number(parts[2]);
  
  var date = new Date(year, month, day);
  var dayOfWeek = date.getDay(); // 0 是週日，1-6 是週一至週六
  
  // 計算本週一的日期
  var diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  var monday = new Date(year, month, diff);
  
  var weeklyDeficit = 0;
  var hasWeeklyRecords = false;
  
  for (var i = 0; i < 7; i++) {
    var cur = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    var y = cur.getFullYear();
    var m = (cur.getMonth() + 1).toString();
    if (m.length === 1) m = '0' + m;
    var d = cur.getDate().toString();
    if (d.length === 1) d = '0' + d;
    var curDateStr = y + '-' + m + '-' + d;
    
    if (allRecs[curDateStr]) {
      var rec = allRecs[curDateStr];
      var breakfast = rec.intake?.breakfast || 0;
      var lunch = rec.intake?.lunch || 0;
      var dinner = rec.intake?.dinner || 0;
      var snacks = rec.intake?.snacks || 0;
      var totalIntake = breakfast + lunch + dinner + snacks;
      if (totalIntake > 0) {
        var dailyDeficit = totalIntake - (rec.tdee || 0);
        weeklyDeficit += dailyDeficit;
        hasWeeklyRecords = true;
      }
    }
  }
  
  var monthlyDeficit = 0;
  var hasMonthlyRecords = false;
  var monthPrefix = targetDateStr.substring(0, 7); // YYYY-MM
  
  Object.keys(allRecs).forEach(function(dKey) {
    if (dKey.indexOf(monthPrefix) === 0) {
      var rec = allRecs[dKey];
      var breakfast = rec.intake?.breakfast || 0;
      var lunch = rec.intake?.lunch || 0;
      var dinner = rec.intake?.dinner || 0;
      var snacks = rec.intake?.snacks || 0;
      var totalIntake = breakfast + lunch + dinner + snacks;
      if (totalIntake > 0) {
        var dailyDeficit = totalIntake - (rec.tdee || 0);
        monthlyDeficit += dailyDeficit;
        hasMonthlyRecords = true;
      }
    }
  });
  
  return {
    weekly: hasWeeklyRecords ? weeklyDeficit : "",
    monthly: hasMonthlyRecords ? monthlyDeficit : ""
  };
}

// 輔助函數：規格化日期字串為 YYYY-MM-DD
function normalizeDateStr(dateInput, sheetName) {
  if (dateInput instanceof Date) {
    return Utilities.formatDate(dateInput, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  var str = String(dateInput).trim();
  if (!str) return "";

  // 1. 匹配 YYYY/MM/DD 或 YYYY-MM-DD
  var matchFull = str.match(/^(\\d{4})[\\/\\-.](\\d{1,2})[\\/\\-.](\\d{1,2})$/);
  if (matchFull) {
    var y = matchFull[1];
    var m = matchFull[2];
    if (m.length === 1) m = "0" + m;
    var d = matchFull[3];
    if (d.length === 1) d = "0" + d;
    return y + "-" + m + "-" + d;
  }

  // 2. 匹配 MM/DD 或 MM-DD (省略年份，例如 6/15)
  var matchShort = str.match(/^(\\d{1,2})[\\/\\-.](\\d{1,2})$/);
  if (matchShort) {
    var year = new Date().getFullYear();
    var yearMatch = String(sheetName || "").match(/^(\\d{4})-\\d{2}$/);
    if (yearMatch) year = Number(yearMatch[1]);
    var m = matchShort[1];
    if (m.length === 1) m = "0" + m;
    var d = matchShort[2];
    if (d.length === 1) d = "0" + d;
    return year + "-" + m + "-" + d;
  }

  // 3. 匹配純日期數字 (例如 15 或 15日)
  var matchDay = str.match(/^(\\d{1,2})(日)?$/);
  if (matchDay) {
    var dVal = matchDay[1];
    if (dVal.length === 1) dVal = "0" + dVal;
    
    var year = new Date().getFullYear();
    var monthStr = (new Date().getMonth() + 1).toString();
    
    var ymM = String(sheetName || "").match(/^(\\d{4})-(\\d{2})$/);
    if (ymM) {
      year = Number(ymM[1]);
      monthStr = ymM[2];
    } else {
      var mMatch = String(sheetName || "").match(/^(\\d{1,2})月$/);
      if (mMatch) {
        monthStr = mMatch[1];
      }
    }
    if (monthStr.length === 1) monthStr = "0" + monthStr;
    return year + "-" + monthStr + "-" + dVal;
  }

  return str;
}
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      if (urlInput && !urlInput.startsWith('http')) {
        setSaveStatus('error');
        setIsSaving(false);
        return;
      }
      onSaveUrl(urlInput.trim());
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerPush = async () => {
    if (!webAppUrl) return;
    setSyncStatus('syncing');
    setSyncMsg('正在備份上傳至 Google Sheets...');
    const success = await onSyncPush();
    if (success) {
      setSyncStatus('success');
      setSyncMsg('上傳備份成功！');
    } else {
      setSyncStatus('error');
      setSyncMsg('上傳備份失敗，請檢查 URL 及網絡。');
    }
    setTimeout(() => setSyncStatus('idle'), 4000);
  };

  const triggerPull = async () => {
    if (!webAppUrl) return;
    if (confirm('從雲端下載將會覆蓋您手機本地的紀錄，確定繼續？')) {
      setSyncStatus('syncing');
      setSyncMsg('正在從 Google Sheets 下載還原...');
      const success = await onSyncPull();
      if (success) {
        setSyncStatus('success');
        setSyncMsg('還原成功！');
      } else {
        setSyncStatus('error');
        setSyncMsg('還原失敗，請檢查 URL 及網絡。');
      }
      setTimeout(() => setSyncStatus('idle'), 4000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Container */}
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md max-h-[85vh] rounded-3xl overflow-y-auto flex flex-col shadow-2xl relative animate-slideUp">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-5 pb-3 border-b border-zinc-900 sticky top-0 bg-zinc-950 z-10">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-400" />
            <span>雲端試算表同步 (Google Sheets)</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 space-y-6">
          
          {/* Status block */}
          <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-2xl space-y-3.5 text-xs text-zinc-300">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-semibold">本地紀錄數</span>
              <span className="font-bold text-zinc-100">{Object.keys(records).length} 天</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-semibold">上次同步時間</span>
              <span className="font-bold text-zinc-100 font-mono">
                {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : '從未同步'}
              </span>
            </div>

            {webAppUrl ? (
              <div className="flex gap-2 pt-1.5">
                <button
                  onClick={triggerPush}
                  disabled={syncStatus === 'syncing'}
                  className="flex-1 flex items-center justify-center space-x-1 py-2 bg-blue-500 hover:bg-blue-400 text-zinc-950 font-bold rounded-xl active:scale-98 transition disabled:opacity-50 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>備份至雲端</span>
                </button>
                <button
                  onClick={triggerPull}
                  disabled={syncStatus === 'syncing'}
                  className="flex-1 flex items-center justify-center space-x-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl border border-zinc-750 active:scale-98 transition disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下載至本地</span>
                </button>
              </div>
            ) : (
              <div className="text-amber-400/90 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl flex items-start space-x-1.5 leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>未配置網址。目前僅使用瀏覽器 LocalStorage。請參照下方教學連結試算表。</span>
              </div>
            )}

            {syncStatus !== 'idle' && (
              <div className={`p-2.5 rounded-xl flex items-center space-x-2 border ${
                syncStatus === 'syncing' ? 'bg-blue-500/5 text-blue-400 border-blue-500/10' :
                syncStatus === 'success' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' :
                'bg-rose-500/5 text-rose-400 border-rose-500/10'
              }`}>
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span className="font-semibold">{syncMsg}</span>
              </div>
            )}
          </div>

          {/* Config Input block */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 flex items-center space-x-1.5">
              <Link className="w-4 h-4 text-blue-400" />
              <span>配置 Google Apps Script 網頁應用程式網址</span>
            </h3>
            
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full text-xs bg-zinc-950 border border-zinc-850 focus:border-blue-500/50 rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none transition-all font-mono placeholder-zinc-750"
            />
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:brightness-110 font-bold rounded-xl text-xs active:scale-98 transition cursor-pointer"
            >
              {isSaving ? '保存中...' : '保存設定'}
            </button>

            {saveStatus === 'success' && (
              <p className="text-[10px] text-emerald-400 text-center font-medium">✓ 儲存成功！已連結您的雲端試算表。</p>
            )}
            {saveStatus === 'error' && (
              <p className="text-[10px] text-rose-400 text-center font-medium">✗ 網址格式錯誤，請輸入以 http 帶頭的正確網址。</p>
            )}
          </div>

          {/* Tutorial instructions */}
          <div className="border-t border-zinc-900 pt-5 space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-blue-400" />
              <span>五分鐘快速設定同步教學</span>
            </h3>

            <div className="space-y-3 text-[11px] text-zinc-400 leading-relaxed">
              <div className="flex space-x-2">
                <span className="w-4 h-4 bg-zinc-800 text-blue-400 font-bold rounded-full flex items-center justify-center shrink-0">1</span>
                <div>
                  <span className="font-semibold text-zinc-200">複製下方 Apps Script 後端程式碼</span>
                </div>
              </div>

              {/* Code Copier */}
              <div className="relative rounded-xl bg-zinc-950 border border-zinc-850 p-3 max-h-32 overflow-y-auto">
                <pre className="font-mono text-[9px] text-zinc-500 select-all whitespace-pre">
                  {APPS_SCRIPT_CODE}
                </pre>
                <button
                  onClick={handleCopyCode}
                  className="absolute top-2 right-2 p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition flex items-center space-x-1 cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 text-emerald-400" />
                      <span className="text-[8px] text-emerald-400">已複製</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3" />
                      <span className="text-[8px]">複製</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex space-x-2">
                <span className="w-4 h-4 bg-zinc-800 text-blue-400 font-bold rounded-full flex items-center justify-center shrink-0">2</span>
                <div>
                  <span className="text-zinc-200">開啟您的試算表選單</span> &gt; <strong>「擴充功能 (Extensions)」</strong> &gt; <strong>「Apps Script」</strong>，清空編輯器，貼上剛才複製的程式碼，並點擊上方儲存按鈕。
                </div>
              </div>

              <div className="flex space-x-2">
                <span className="w-4 h-4 bg-zinc-800 text-blue-400 font-bold rounded-full flex items-center justify-center shrink-0">3</span>
                <div>
                  點擊右上角 <strong>「部署 (Deploy)」</strong> &gt; <strong>「新增部署 (New deployment)」</strong>。選取齒輪圖標並選擇 <strong>「網頁應用程式 (Web app)」</strong>。
                </div>
              </div>

              <div className="flex space-x-2">
                <span className="w-4 h-4 bg-zinc-800 text-blue-400 font-bold rounded-full flex items-center justify-center shrink-0">4</span>
                <div>
                  設定 <strong>「將存取權限給予所有人 (Who has access)」</strong> 為 <strong>「所有人 (Anyone)」</strong>，然後點擊部署。授權通過後複製取得的 <strong>「網頁應用程式網址」</strong> 並貼上到上方保存即可！
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
