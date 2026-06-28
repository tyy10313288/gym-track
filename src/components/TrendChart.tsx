'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Scale, Flame, Activity, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { DailyRecords } from '../types/fitness';

interface TrendChartProps {
  records: DailyRecords;
  selectedDate: string;
}

type MetricType = 'weight' | 'bodyFat' | 'muscle' | 'calorieDeficit';
type TimeRangeType = '7' | '30';

export const TrendChart: React.FC<TrendChartProps> = ({ records, selectedDate }) => {
  const [timeRange, setTimeRange] = useState<TimeRangeType>('7');
  const [metric, setMetric] = useState<MetricType>('weight');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // SVG Dimension Constants
  const viewBoxWidth = 500;
  const viewBoxHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;
  const chartWidth = viewBoxWidth - paddingLeft - paddingRight; // 440
  const chartHeight = viewBoxHeight - paddingTop - paddingBottom; // 170

  // 1. Get dates in range ending on selectedDate
  const dates = useMemo(() => {
    const rangeDays = Number(timeRange);
    const datesList: string[] = [];
    const end = new Date(selectedDate);
    if (isNaN(end.getTime())) return [];

    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      datesList.push(`${y}-${m}-${day}`);
    }
    return datesList;
  }, [selectedDate, timeRange]);

  // 2. Extract data points for each date
  const allPoints = useMemo(() => {
    return dates.map((date, idx) => {
      const record = records[date];
      let val: number | null = null;

      if (metric === 'weight') {
        val = record?.body?.weight ?? null;
      } else if (metric === 'bodyFat') {
        val = record?.body?.bodyFat ?? null;
      } else if (metric === 'muscle') {
        val = record?.body?.muscle ?? null;
      } else if (metric === 'calorieDeficit') {
        if (record?.intake) {
          const intake = record.intake;
          const totalIntake = (intake.breakfast || 0) + (intake.lunch || 0) + (intake.dinner || 0) + (intake.snacks || 0);
          if (totalIntake > 0) {
            val = totalIntake - (record.tdee || 2000);
          }
        }
      }

      return { date, value: val, index: idx };
    });
  }, [dates, records, metric]);

  // 3. Filter valid points (non-null) for line rendering
  const validPoints = useMemo(() => {
    return allPoints.filter((p) => p.value !== null) as { date: string; value: number; index: number }[];
  }, [allPoints]);

  // 4. Calculate Y Min / Max with padding buffer
  const yBounds = useMemo(() => {
    if (validPoints.length === 0) return { min: 0, max: 100 };
    const values = validPoints.map((p) => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);

    if (min === max) {
      const buffer = metric === 'calorieDeficit' ? 500 : 2;
      min -= buffer;
      max += buffer;
    } else {
      const diff = max - min;
      // Add a 15% buffer above and below
      min -= diff * 0.15;
      max += diff * 0.15;
    }

    return { min, max };
  }, [validPoints, metric]);

  // Metric-specific formatting/style configurations
  const config = useMemo(() => {
    switch (metric) {
      case 'weight':
        return {
          title: '體重趨勢',
          unit: 'kg',
          strokeColor: '#3b82f6', // blue-500
          fillColorStart: 'rgba(59, 130, 246, 0.25)',
          fillColorEnd: 'rgba(59, 130, 246, 0.0)',
          icon: <Scale className="w-4 h-4 text-blue-400" />,
          formatVal: (v: number) => `${v.toFixed(1)} kg`,
        };
      case 'bodyFat':
        return {
          title: '體脂率趨勢',
          unit: '%',
          strokeColor: '#a855f7', // purple-500
          fillColorStart: 'rgba(168, 85, 247, 0.25)',
          fillColorEnd: 'rgba(168, 85, 247, 0.0)',
          icon: <Activity className="w-4 h-4 text-purple-400" />,
          formatVal: (v: number) => `${v.toFixed(1)}%`,
        };
      case 'muscle':
        return {
          title: '骨骼肌率趨勢',
          unit: '%',
          strokeColor: '#06b6d4', // cyan-500
          fillColorStart: 'rgba(6, 182, 212, 0.25)',
          fillColorEnd: 'rgba(6, 182, 212, 0.0)',
          icon: <Activity className="w-4 h-4 text-cyan-400" />,
          formatVal: (v: number) => `${v.toFixed(1)}%`,
        };
      case 'calorieDeficit':
        return {
          title: '熱量缺口趨勢',
          unit: 'kcal',
          strokeColor: '#10b981', // emerald-500
          fillColorStart: 'rgba(16, 185, 129, 0.25)',
          fillColorEnd: 'rgba(16, 185, 129, 0.0)',
          icon: <Flame className="w-4 h-4 text-emerald-400" />,
          formatVal: (v: number) => `${v > 0 ? `+${Math.round(v)}` : Math.round(v)} kcal`,
        };
    }
  }, [metric]);

  // 5. Generate line paths and point positions
  const chartPaths = useMemo(() => {
    if (validPoints.length === 0) return { line: '', area: '', points: [] };

    const points = validPoints.map((p) => {
      const x = paddingLeft + (p.index / (dates.length - 1)) * chartWidth;
      const y = paddingTop + (1 - (p.value - yBounds.min) / (yBounds.max - yBounds.min)) * chartHeight;
      return { x, y, value: p.value, date: p.date, index: p.index };
    });

    const line = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    
    const bottomY = paddingTop + chartHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const area = `${line} L ${lastX.toFixed(1)} ${bottomY.toFixed(1)} L ${firstX.toFixed(1)} ${bottomY.toFixed(1)} Z`;

    return { line, area, points };
  }, [validPoints, dates.length, yBounds, chartWidth, chartHeight]);

  // Date label formatting helper (YYYY-MM-DD -> MM/DD)
  const formatAxisDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
  };

  // Hover position calculations
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current || dates.length <= 1) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const mouseX = clientX - rect.left;

    // Scale from DOM pixel width to SVG viewBox width
    const scale = viewBoxWidth / rect.width;
    const svgX = mouseX * scale;

    const relativeX = svgX - paddingLeft;
    const percentage = relativeX / chartWidth;
    const idx = Math.round(percentage * (dates.length - 1));
    const safeIdx = Math.max(0, Math.min(dates.length - 1, idx));

    setHoveredIdx(safeIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  // Tooltip details
  const tooltipData = useMemo(() => {
    if (hoveredIdx === null) return null;
    const date = dates[hoveredIdx];
    const point = allPoints[hoveredIdx];
    
    // Check if there is calorie data or body data
    const record = records[date];
    let extraInfo = '';
    if (record) {
      if (metric === 'calorieDeficit' && record.intake) {
        const total = (record.intake.breakfast || 0) + (record.intake.lunch || 0) + (record.intake.dinner || 0) + (record.intake.snacks || 0);
        extraInfo = `攝取: ${total} / TDEE: ${record.tdee || 2000}`;
      } else if (metric === 'weight' && record.body?.bodyFat) {
        extraInfo = `體脂率: ${record.body.bodyFat}%`;
      } else if (record.body?.weight) {
        extraInfo = `體重: ${record.body.weight}kg`;
      }
    }

    const percentX = (paddingLeft + (hoveredIdx / (dates.length - 1)) * chartWidth) / viewBoxWidth;
    
    let percentY = 0.5;
    if (point && point.value !== null) {
      percentY = (paddingTop + (1 - (point.value - yBounds.min) / (yBounds.max - yBounds.min)) * chartHeight) / viewBoxHeight;
    }

    return {
      date,
      displayDate: formatAxisDate(date),
      value: point?.value ?? null,
      extraInfo,
      left: `${(percentX * 100).toFixed(1)}%`,
      top: `${(percentY * 100).toFixed(1)}%`,
    };
  }, [hoveredIdx, dates, allPoints, yBounds, records, metric]);

  // Determine vertical axis line label positions (bottom, middle, top)
  const yAxisTicks = useMemo(() => {
    const diff = yBounds.max - yBounds.min;
    return [
      { y: paddingTop + chartHeight, value: yBounds.min },
      { y: paddingTop + chartHeight / 2, value: yBounds.min + diff / 2 },
      { y: paddingTop, value: yBounds.max },
    ];
  }, [yBounds]);

  // Helper for rendering date labels on X-axis nicely without overlapping
  const xAxisTicks = useMemo(() => {
    const step = timeRange === '7' ? 1 : 5;
    const ticks = [];
    for (let i = 0; i < dates.length; i += step) {
      ticks.push({ index: i, date: dates[i] });
    }
    // Always include the last date for symmetry if not already included
    if ((dates.length - 1) % step !== 0) {
      ticks.push({ index: dates.length - 1, date: dates[dates.length - 1] });
    }
    return ticks;
  }, [dates, timeRange]);

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-3xl p-5 shadow-lg space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800/60 pb-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-semibold text-zinc-300">數據變化趨勢</h2>
        </div>

        {/* Time range selector */}
        <div className="flex bg-zinc-950 border border-zinc-850 rounded-xl p-0.5 self-start">
          <button
            onClick={() => setTimeRange('7')}
            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
              timeRange === '7' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-350'
            }`}
          >
            最近7天
          </button>
          <button
            onClick={() => setTimeRange('30')}
            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
              timeRange === '30' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-350'
            }`}
          >
            最近30天
          </button>
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="grid grid-cols-4 gap-1.5 bg-zinc-950/40 p-1 border border-zinc-900 rounded-2xl">
        {(['weight', 'bodyFat', 'muscle', 'calorieDeficit'] as MetricType[]).map((m) => {
          const isActive = metric === m;
          let label = '';
          let activeStyles = '';
          if (m === 'weight') {
            label = '體重';
            activeStyles = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
          } else if (m === 'bodyFat') {
            label = '體脂';
            activeStyles = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
          } else if (m === 'muscle') {
            label = '肌率';
            activeStyles = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
          } else if (m === 'calorieDeficit') {
            label = '熱量';
            activeStyles = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
          }

          return (
            <button
              key={m}
              onClick={() => {
                setMetric(m);
                setHoveredIdx(null);
              }}
              className={`py-1.5 text-[10px] font-bold rounded-xl transition-all border border-transparent ${
                isActive ? activeStyles : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Chart Canvas Area */}
      <div className="relative pt-2">
        {validPoints.length === 0 ? (
          /* Empty State */
          <div className="h-[220px] flex flex-col items-center justify-center bg-zinc-950/20 border border-dashed border-zinc-850 rounded-2xl p-6 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-zinc-650" />
            <p className="text-xs text-zinc-400 font-medium">此期間無數據記錄</p>
            <p className="text-[10px] text-zinc-600 max-w-[240px] leading-relaxed">
              選定日為 {selectedDate}。請切換至「磅重」或「飲食」分頁輸入歷史數據，系統將自動繪製趨勢圖。
            </p>
          </div>
        ) : (
          /* SVG Line Chart */
          <div className="relative w-full">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
              className="w-full h-auto overflow-visible select-none cursor-crosshair touch-none"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseLeave}
            >
              <defs>
                {/* Glow Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Fill Area Gradient */}
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={config.strokeColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={config.strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              {/* 1. Horizontal Grid Lines */}
              {yAxisTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={tick.y}
                    x2={viewBoxWidth - paddingRight}
                    y2={tick.y}
                    stroke="#27272a"
                    strokeWidth="1"
                    strokeDasharray={i === 0 ? 'none' : '3 3'}
                  />
                  {/* Y Axis Values */}
                  <text
                    x={paddingLeft - 8}
                    y={tick.y + 3}
                    textAnchor="end"
                    className="fill-zinc-550 text-[9px] font-mono font-medium"
                  >
                    {metric === 'calorieDeficit' ? Math.round(tick.value) : tick.value.toFixed(1)}
                  </text>
                </g>
              ))}

              {/* 2. Vertical Date Helper Grid Ticks */}
              {xAxisTicks.map((tick) => {
                const x = paddingLeft + (tick.index / (dates.length - 1)) * chartWidth;
                return (
                  <g key={tick.index}>
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={viewBoxHeight - paddingBottom}
                      stroke="#27272a"
                      strokeWidth="1"
                      strokeDasharray="2 4"
                      className="opacity-40"
                    />
                    {/* X Axis Dates */}
                    <text
                      x={x}
                      y={viewBoxHeight - paddingBottom + 16}
                      textAnchor="middle"
                      className="fill-zinc-550 text-[9px] font-mono font-semibold"
                    >
                      {formatAxisDate(tick.date)}
                    </text>
                  </g>
                );
              })}

              {/* 3. Gradient Area Path Under Curve */}
              {validPoints.length > 1 && (
                <path d={chartPaths.area} fill="url(#areaGrad)" className="pointer-events-none" />
              )}

              {/* 4. Stroke Trend Line */}
              {validPoints.length > 1 && (
                <path
                  d={chartPaths.line}
                  fill="none"
                  stroke={config.strokeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none"
                  filter="url(#glow)"
                />
              )}

              {/* 5. Data Point Circles */}
              {chartPaths.points.map((p) => {
                const isHovered = hoveredIdx === p.index;
                return (
                  <circle
                    key={p.index}
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 5.5 : 3.5}
                    fill={config.strokeColor}
                    stroke="#09090b"
                    strokeWidth={isHovered ? 2 : 1.5}
                    className="transition-all duration-100 pointer-events-none"
                  />
                );
              })}

              {/* 6. Active Hover Vertical Bar Indicator */}
              {hoveredIdx !== null && (
                <line
                  x1={paddingLeft + (hoveredIdx / (dates.length - 1)) * chartWidth}
                  y1={paddingTop}
                  x2={paddingLeft + (hoveredIdx / (dates.length - 1)) * chartWidth}
                  y2={viewBoxHeight - paddingBottom}
                  stroke="#3f3f46"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  className="pointer-events-none"
                />
              )}
            </svg>

            {/* 7. HTML Interactive Tooltip Overlay */}
            {tooltipData && (
              <div
                className="absolute bg-zinc-950/95 border border-zinc-850 rounded-2xl p-2.5 shadow-2xl text-[10px] pointer-events-none z-30 flex flex-col space-y-1 backdrop-blur-md transition-all duration-75"
                style={{
                  left: tooltipData.left,
                  top: tooltipData.top,
                  transform: 'translate(-50%, -115%)',
                  minWidth: '100px',
                }}
              >
                <div className="flex justify-between items-center border-b border-zinc-900 pb-1 gap-3">
                  <span className="text-zinc-550 font-mono font-bold flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-zinc-550" />
                    <span>{tooltipData.displayDate}</span>
                  </span>
                  <span className="font-semibold text-zinc-400">
                    {tooltipData.date === selectedDate && '選中日'}
                  </span>
                </div>
                {tooltipData.value !== null ? (
                  <div className="flex flex-col">
                    <span className="text-zinc-200 font-bold font-mono text-xs">
                      {config.formatVal(tooltipData.value)}
                    </span>
                    {tooltipData.extraInfo && (
                      <span className="text-[9px] text-zinc-500 mt-0.5 leading-tight font-medium">
                        {tooltipData.extraInfo}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-zinc-650 italic">無紀錄</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend & Period Summary statistics */}
      {validPoints.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-850/60 text-[10px] text-zinc-500 font-medium">
          <div className="flex flex-col space-y-0.5">
            <span>期間平均</span>
            <span className="font-bold text-zinc-300 font-mono">
              {config.formatVal(
                validPoints.reduce((acc, p) => acc + p.value, 0) / validPoints.length
              )}
            </span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span>期間最低</span>
            <span className="font-bold text-zinc-300 font-mono">
              {config.formatVal(Math.min(...validPoints.map((p) => p.value)))}
            </span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span>期間最高</span>
            <span className="font-bold text-zinc-300 font-mono">
              {config.formatVal(Math.max(...validPoints.map((p) => p.value)))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
