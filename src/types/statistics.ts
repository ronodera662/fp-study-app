// 日別統計型定義
export interface DailyStats {
  id: string;
  date: string; // YYYY-MM-DD
  questionsSolved: number;
  correctAnswers: number;
  studyTimeMinutes: number;
  sessionsCount: number;
}

// カテゴリ別統計
export interface CategoryStats {
  category: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  accuracy: number;
}

// 全体統計
export interface OverallStats {
  totalQuestionsSolved: number;
  overallAccuracy: number;
  totalStudyTimeMinutes: number;
  currentStreak: number;
  longestStreak: number;
}
