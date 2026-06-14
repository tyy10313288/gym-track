'use client';

import React, { useState } from 'react';
import { Database, Link, Copy, Check, Info, RefreshCw, Upload, Download, ArrowRight, ShieldCheck } from 'lucide-react';
import { SyncConfig, WorkoutLog, WeeklySchedule } from '../types/gym';

interface SettingsViewProps {
  syncConfig: SyncConfig;
  setSyncConfig: (config: SyncConfig) => void;
  logs: WorkoutLog[];
  schedule: WeeklySchedule;
  onSyncPush: () => Promise<boolean>;
  onSyncPull: () => Promise<boolean>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  syncConfig,
  setSyncConfig,
  logs,
  schedule,
  onSyncPush,
  onSyncPull,
}) => {
  const [urlInput, setUrlInput] = useState(syncConfig.webAppUrl);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMsg, setSyncMsg] = useState('');

  const APPS_SCRIPT_CODE = `// 貼上到 Google Apps Script 的程式碼
function doGet(e) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  
  // 初始化工作表
  var scheduleSheet = doc.getSheetByName("Schedule") || doc.insertSheet("Schedule");
  var logsSheet = doc.getSheetByName("Logs") || doc.insertSheet("Logs");
  
  // 取得課表資料
  var scheduleData = {};
  var scheduleRows = scheduleSheet.getDataRange().getValues();
  if (scheduleRows.length > 1) {
    for (var i = 1; i < scheduleRows.length; i++) {
      scheduleData[scheduleRows[i][0]] = scheduleRows[i][1];
    }
  }
  
  // 取得訓練紀錄
  var logsData = [];
  var logsRows = logsSheet.getDataRange().getValues();
  if (logsRows.length > 1) {
    for (var i = 1; i < logsRows.length; i++) {
      try {
        logsData.push(JSON.parse(logsRows[i][2]));
      } catch(err) {
        // 忽略解析錯誤的行
      }
    }
  }
  
  var response = {
    schedule: scheduleData,
    logs: logsData
  };
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var params = JSON.parse(e.postData.contents);
  var action = params.action;
  
  var scheduleSheet = doc.getSheetByName("Schedule") || doc.insertSheet("Schedule");
  var logsSheet = doc.getSheetByName("Logs") || doc.insertSheet("Logs");
  
  if (action === 'sync_all' || action === 'update_schedule') {
    var schedule = params.schedule;
    scheduleSheet.clear();
    scheduleSheet.appendRow(["Day", "TemplateId"]);
    var days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (var i = 0; i < days.length; i++) {
      var d = days[i];
      scheduleSheet.appendRow([d, schedule[d] || 'rest']);
    }
  }
  
  if (action === 'sync_all' || action === 'add_log') {
    var logs = params.logs;
    if (action === 'add_log') {
      logs = [params.log];
    }
    
    if (action === 'sync_all') {
      logsSheet.clear();
      logsSheet.appendRow(["LogId", "Date", "JSONData"]);
      for (var i = 0; i < logs.length; i++) {
        logsSheet.appendRow([logs[i].id, logs[i].date, JSON.stringify(logs[i])]);
      }
    } else if (action === 'add_log') {
      var existingRows = logsSheet.getDataRange().getValues();
      var idExists = false;
      for (var i = 1; i < existingRows.length; i++) {
        if (existingRows[i][0] === params.log.id) {
          idExists = true;
          logsSheet.getRange(i + 1, 2, 1, 2).setValues([[params.log.date, JSON.stringify(params.log)]]);
          break;
        }
      }
      if (!idExists) {
        if (existingRows.length === 0 || existingRows[0][0] !== "LogId") {
          logsSheet.appendRow(["LogId", "Date", "JSONData"]);
        }
        logsSheet.appendRow([params.log.id, params.log.date, JSON.stringify(params.log)]);
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      // Simple validation URL structure
      if (urlInput && !urlInput.startsWith('http')) {
        setSaveStatus('error');
        setIsSaving(false);
        return;
      }
      
      setSyncConfig({
        webAppUrl: urlInput.trim(),
        lastSyncedAt: syncConfig.lastSyncedAt
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerPush = async () => {
    if (!syncConfig.webAppUrl) {
      alert('請先設定 Google Sheets 網頁應用程式網址！');
      return;
    }
    setSyncStatus('syncing');
    setSyncMsg('正在上傳本地數據到 Google Sheets...');
    const success = await onSyncPush();
    if (success) {
      setSyncStatus('success');
      setSyncMsg('上傳同步完成！');
    } else {
      setSyncStatus('error');
      setSyncMsg('上傳同步失敗，請檢查 URL 及網絡。');
    }
    setTimeout(() => setSyncStatus('idle'), 4000);
  };

  const triggerPull = async () => {
    if (!syncConfig.webAppUrl) {
      alert('請先設定 Google Sheets 網頁應用程式網址！');
      return;
    }
    if (confirm('從雲端拉取將覆蓋本地的課表與日誌。確定繼續？')) {
      setSyncStatus('syncing');
      setSyncMsg('正在從 Google Sheets 拉取雲端數據...');
      const success = await onSyncPull();
      if (success) {
        setSyncStatus('success');
        setSyncMsg('下載同步完成！');
      } else {
        setSyncStatus('error');
        setSyncMsg('下載同步失敗，請檢查 URL 及網絡。');
      }
      setTimeout(() => setSyncStatus('idle'), 4000);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-24 text-zinc-100">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">
          雲端試算表同步 (Google Sheets)
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          將你所有的健身數據儲存到自訂的 Google Sheet，隨時隨地備份與查看。
        </p>
      </div>

      {/* Sync Status / Quick Sync Card */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-sm">數據庫狀態</span>
          </div>
          {syncConfig.lastSyncedAt ? (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              上次同步: {new Date(syncConfig.lastSyncedAt).toLocaleString()}
            </span>
          ) : (
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
              尚未同步
            </span>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/30">
            <span className="text-zinc-500 block">本地紀錄</span>
            <span className="text-lg font-bold text-zinc-200 mt-0.5 block">{logs.length} 筆</span>
          </div>
          <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/30">
            <span className="text-zinc-500 block">每週規劃</span>
            <span className="text-lg font-bold text-zinc-200 mt-0.5 block">已排程</span>
          </div>
        </div>

        {syncConfig.webAppUrl ? (
          <div className="flex space-x-2">
            <button
              onClick={triggerPush}
              disabled={syncStatus === 'syncing'}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold rounded-xl text-xs active:scale-98 transition disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>上傳至雲端</span>
            </button>
            <button
              onClick={triggerPull}
              disabled={syncStatus === 'syncing'}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 font-bold rounded-xl text-xs border border-zinc-700/50 active:scale-98 transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-zinc-300" />
              <span>從雲端拉取</span>
            </button>
          </div>
        ) : (
          <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex items-start space-x-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>尚未配置 API 網址，系統正使用 LocalStorage 運行。請參考下方說明進行設定。</span>
          </div>
        )}

        {/* Sync Status Banner */}
        {syncStatus !== 'idle' && (
          <div className={`mt-3 p-2.5 rounded-xl text-xs flex items-center space-x-2 ${
            syncStatus === 'syncing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            syncStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>{syncMsg}</span>
          </div>
        )}
      </div>

      {/* API URL Config Form */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-sm mb-3 flex items-center space-x-1.5">
          <Link className="w-4 h-4 text-amber-500" />
          <span>配置 API 連接</span>
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">GOOGLE APPS SCRIPT WEB APP URL</label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 hover:brightness-110 font-bold rounded-xl text-xs active:scale-98 transition"
          >
            {isSaving ? '正在儲存...' : '保存設定'}
          </button>

          {saveStatus === 'success' && (
            <p className="text-[10px] text-emerald-400 text-center font-medium">✓ 配置儲存成功！可用於雲端上傳/下載。</p>
          )}
          {saveStatus === 'error' && (
            <p className="text-[10px] text-rose-400 text-center font-medium">✗ 網址格式錯誤，請輸入正確的 HTTP(S) 連結。</p>
          )}
        </div>
      </div>

      {/* Guide Card (Collapsible style instructions) */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 text-xs">
        <h3 className="font-bold text-sm mb-4 flex items-center space-x-1.5">
          <ShieldCheck className="w-4.5 h-4.5 text-amber-500" />
          <span>五分鐘快速設定教學</span>
        </h3>

        <div className="space-y-4 text-zinc-300">
          <div className="flex items-start space-x-2">
            <div className="bg-zinc-800 text-amber-400 font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">1</div>
            <div>
              <p className="font-semibold text-zinc-200">創建 Google 試算表</p>
              <p className="text-zinc-400 mt-0.5">進入 <a href="https://sheets.google.com" target="_blank" rel="noreferrer" className="text-amber-500 underline">Google Sheets</a>，新增一個空白試算表。</p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <div className="bg-zinc-800 text-amber-400 font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">2</div>
            <div>
              <p className="font-semibold text-zinc-200">打開 Apps Script 編輯器</p>
              <p className="text-zinc-400 mt-0.5">在選單列點擊 <strong>擴充功能 (Extensions)</strong> &gt; <strong>Apps Script</strong>。</p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <div className="bg-zinc-800 text-amber-400 font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">3</div>
            <div>
              <p className="font-semibold text-zinc-200">複製並貼上後端程式碼</p>
              <p className="text-zinc-400 mt-0.5">刪除編輯器內的預設程式碼，然後複製下方這段後端指令碼並貼上。</p>
              
              {/* Code Box */}
              <div className="relative mt-2 rounded-xl bg-zinc-950 border border-zinc-800 p-3 max-h-48 overflow-y-auto">
                <pre className="font-mono text-[10px] text-zinc-400 select-all whitespace-pre">
                  {APPS_SCRIPT_CODE}
                </pre>
                <button
                  onClick={handleCopyCode}
                  className="absolute top-2 right-2 p-1.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 rounded-lg transition flex items-center space-x-1"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[9px] text-emerald-400">已複製</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[9px]">複製</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <div className="bg-zinc-800 text-amber-400 font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">4</div>
            <div>
              <p className="font-semibold text-zinc-200">發布為網頁應用程式</p>
              <p className="text-zinc-400 mt-0.5">
                1. 點擊右上角 <strong>部署 (Deploy)</strong> &gt; <strong>新增部署 (New deployment)</strong>。<br />
                2. 點擊齒輪圖標，選擇 <strong>網頁應用程式 (Web app)</strong>。<br />
                3. 「將存取權限給予所有人 (Who has access)」選擇 <strong>所有人 (Anyone)</strong>。<br />
                4. 點擊 <strong>部署</strong> 並通過 Google 權限授權，然後複製產生的 <strong>網頁應用程式網址 (Web app URL)</strong>。
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <div className="bg-zinc-800 text-amber-400 font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">5</div>
            <div>
              <p className="font-semibold text-zinc-200">貼上並完成綁定</p>
              <p className="text-zinc-400 mt-0.5">將剛才複製的網址貼到上面的輸入框中，點擊<strong>「保存設定」</strong>。點擊<strong>「上傳至雲端」</strong>按鈕即可同步你的所有訓練數據！</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
