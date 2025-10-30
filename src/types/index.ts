// 型定義のエクスポート
export type { Question } from './question';
export type { UserAnswer, UserSettings } from './user';
export type { UserProgress } from './progress';
export type { DailyStats, CategoryStats, OverallStats } from './statistics';

// 学習モード型
export type StudyMode = 'random' | 'category' | 'year' | 'weakness' | 'review';

// 学習セッション型
export interface StudySession {
  questions: Question[];
  currentIndex: number;
  answers: UserAnswer[];
  startTime: Date;
  mode: StudyMode;
}
