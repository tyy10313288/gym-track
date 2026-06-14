export interface ExerciseTemplate {
  exerciseId: string;
  name: string;
  category: string; // e.g. "胸部", "背部", "下肢", "肩膀", "核心"
  targetMuscles: string[];
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number; // in kg
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  targetMuscles: string[];
  exercises: ExerciseTemplate[];
}

export interface LoggedSet {
  id: string;
  weight: number; // kg
  reps: number;
  completed: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  name: string;
  category: string;
  sets: LoggedSet[];
}

export interface WorkoutLog {
  id: string; // Unique sync identifier
  date: string; // YYYY-MM-DD
  templateId: string;
  templateName: string;
  exercises: LoggedExercise[];
  durationMinutes: number;
}

export interface CheckInStatus {
  isCheckedIn: boolean;
  startTime: number | null; // Timestamp ms
  durationMinutes: number; // 40 or 80
}

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface WeeklySchedule {
  Mon: string; // Template ID or 'rest'
  Tue: string;
  Wed: string;
  Thu: string;
  Fri: string;
  Sat: string;
  Sun: string;
}

export interface SyncConfig {
  webAppUrl: string;
  lastSyncedAt: string | null;
}
