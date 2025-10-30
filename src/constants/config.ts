// アプリケーション設定
export const APP_CONFIG = {
  name: 'FP過去問マスター',
  version: '1.0.0',
  defaultDailyGoal: 20,
  defaultTheme: 'light' as const,
  questionCountOptions: [10, 20, 30, 50],
} as const;

// データベース設定
export const DB_CONFIG = {
  name: 'FPStudyApp',
  version: 1,
} as const;

// ローカルストレージキー
export const STORAGE_KEYS = {
  userId: 'fp_study_user_id',
  settings: 'fp_study_settings',
  theme: 'fp_study_theme',
} as const;

// 習熟度レベル定義
export const MASTERY_LEVELS = {
  UNSEEN: 0,
  FIRST_TIME: 1,
  REVIEWING: 2,
  MASTERED: 3,
} as const;

// 問題の難易度定義
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;
