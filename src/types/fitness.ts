export interface DailyRecord {
  date: string; // YYYY-MM-DD
  tdee: number;
  intake: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snacks: number;
  };
  foodNotes?: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
  };
  workout: {
    didWorkout: boolean;
    duration: number; // minutes
    description: string;
    categorized?: Record<string, string>;
    generalNote?: string;
    templateId?: string;
  };
  measurements?: {
    waist: number; // 腰圍 cm
    thigh: number; // 大腿圍 cm
  };
  body?: {
    weight: number | null;
    bodyFat: number | null;
    muscle: number | null;
  };
}

export type DailyRecords = Record<string, DailyRecord>;

export interface CheckInStatus {
  isCheckedIn: boolean;
  startTime: number | null; // Timestamp ms
  durationMinutes: number; // 40 or 80
}
