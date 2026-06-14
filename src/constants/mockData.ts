import { WorkoutTemplate, WeeklySchedule, WorkoutLog } from '../types/gym';

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'upper-body',
    name: '範本 A：上半身推拉',
    description: '針對胸、背、肩的推拉訓練，打造強健上半身。',
    targetMuscles: ['胸部', '背部', '肩膀', '手臂'],
    exercises: [
      {
        exerciseId: 'bench-press',
        name: '槓鈴臥推 (Bench Press)',
        category: '胸部',
        targetMuscles: ['胸部', '三頭肌'],
        defaultSets: 4,
        defaultReps: 8,
        defaultWeight: 60,
      },
      {
        exerciseId: 'lat-pulldown',
        name: '滑輪下拉 (Lat Pulldown)',
        category: '背部',
        targetMuscles: ['背部', '二頭肌'],
        defaultSets: 4,
        defaultReps: 10,
        defaultWeight: 45,
      },
      {
        exerciseId: 'dumbbell-shoulder-press',
        name: '啞鈴肩推 (Dumbbell Shoulder Press)',
        category: '肩膀',
        targetMuscles: ['肩膀', '三頭肌'],
        defaultSets: 3,
        defaultReps: 10,
        defaultWeight: 14,
      },
      {
        exerciseId: 'cable-row',
        name: '滑輪划船 (Seated Cable Row)',
        category: '背部',
        targetMuscles: ['背部', '二頭肌'],
        defaultSets: 3,
        defaultReps: 12,
        defaultWeight: 40,
      },
    ],
  },
  {
    id: 'lower-body',
    name: '範本 B：下肢與核心',
    description: '著重股四頭肌、臀大肌與核心穩定的力量訓練。',
    targetMuscles: ['下肢', '核心'],
    exercises: [
      {
        exerciseId: 'barbell-squat',
        name: '槓鈴深蹲 (Barbell Squat)',
        category: '下肢',
        targetMuscles: ['下肢', '臀部'],
        defaultSets: 4,
        defaultReps: 8,
        defaultWeight: 70,
      },
      {
        exerciseId: 'romanian-deadlift',
        name: '羅馬尼亞硬舉 (Romanian Deadlift)',
        category: '下肢',
        targetMuscles: ['下肢', '臀部', '下背'],
        defaultSets: 4,
        defaultReps: 10,
        defaultWeight: 60,
      },
      {
        exerciseId: 'leg-press',
        name: '器械腿推 (Leg Press)',
        category: '下肢',
        targetMuscles: ['下肢'],
        defaultSets: 3,
        defaultReps: 12,
        defaultWeight: 120,
      },
      {
        exerciseId: 'plank',
        name: '平板支撐 (Plank)',
        category: '核心',
        targetMuscles: ['核心'],
        defaultSets: 3,
        defaultReps: 60, // Represents 60 seconds
        defaultWeight: 0,
      },
    ],
  },
  {
    id: 'full-body',
    name: '範本 C：全身輕量',
    description: '高效率全身性肌群啟動與代謝壓力訓練。',
    targetMuscles: ['胸部', '背部', '下肢', '核心'],
    exercises: [
      {
        exerciseId: 'goblet-squat',
        name: '高杯深蹲 (Goblet Squat)',
        category: '下肢',
        targetMuscles: ['下肢', '臀部'],
        defaultSets: 3,
        defaultReps: 12,
        defaultWeight: 20,
      },
      {
        exerciseId: 'push-up',
        name: '伏地挺身 (Push Up)',
        category: '胸部',
        targetMuscles: ['胸部', '手臂'],
        defaultSets: 3,
        defaultReps: 15,
        defaultWeight: 0,
      },
      {
        exerciseId: 'dumbbell-row',
        name: '單臂啞鈴划船 (Dumbbell Row)',
        category: '背部',
        targetMuscles: ['背部', '二頭肌'],
        defaultSets: 3,
        defaultReps: 12,
        defaultWeight: 16,
      },
      {
        exerciseId: 'hanging-leg-raise',
        name: '懸垂舉腿 (Hanging Leg Raise)',
        category: '核心',
        targetMuscles: ['核心'],
        defaultSets: 3,
        defaultReps: 12,
        defaultWeight: 0,
      },
    ],
  },
];

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  Mon: 'upper-body',
  Tue: 'rest',
  Wed: 'lower-body',
  Thu: 'rest',
  Fri: 'full-body',
  Sat: 'rest',
  Sun: 'rest',
};

// Generates some initial mockup logs for past workouts
export const MOCK_WORKOUT_LOGS: WorkoutLog[] = [
  {
    id: 'log-1',
    date: '2026-06-10',
    templateId: 'upper-body',
    templateName: '範本 A：上半身推拉',
    durationMinutes: 48,
    exercises: [
      {
        exerciseId: 'bench-press',
        name: '槓鈴臥推 (Bench Press)',
        category: '胸部',
        sets: [
          { id: 'bp-1', weight: 55, reps: 8, completed: true },
          { id: 'bp-2', weight: 60, reps: 8, completed: true },
          { id: 'bp-3', weight: 60, reps: 8, completed: true },
          { id: 'bp-4', weight: 60, reps: 7, completed: true },
        ],
      },
      {
        exerciseId: 'lat-pulldown',
        name: '滑輪下拉 (Lat Pulldown)',
        category: '背部',
        sets: [
          { id: 'lp-1', weight: 40, reps: 10, completed: true },
          { id: 'lp-2', weight: 45, reps: 10, completed: true },
          { id: 'lp-3', weight: 45, reps: 10, completed: true },
          { id: 'lp-4', weight: 45, reps: 9, completed: true },
        ],
      },
    ],
  },
  {
    id: 'log-2',
    date: '2026-06-12',
    templateId: 'lower-body',
    templateName: '範本 B：下肢與核心',
    durationMinutes: 52,
    exercises: [
      {
        exerciseId: 'barbell-squat',
        name: '槓鈴深蹲 (Barbell Squat)',
        category: '下肢',
        sets: [
          { id: 'bs-1', weight: 65, reps: 8, completed: true },
          { id: 'bs-2', weight: 70, reps: 8, completed: true },
          { id: 'bs-3', weight: 70, reps: 8, completed: true },
          { id: 'bs-4', weight: 70, reps: 8, completed: true },
        ],
      },
    ],
  },
];
