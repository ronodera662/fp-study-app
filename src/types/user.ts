// ユーザー解答履歴型定義
export interface UserAnswer {
  id: string;
  questionId: string;
  userAnswer: number;
  isCorrect: boolean;
  timeSpent?: number;
  answeredAt: Date;
  mode: 'random' | 'category' | 'year' | 'weakness' | 'review';
}

// ユーザー設定型定義
export interface UserSettings {
  id: string;
  targetGrade: '3' | '2';
  examDate?: Date;
  dailyGoal: number;
  reminderEnabled: boolean;
  reminderTime?: string;
  theme: 'light' | 'dark' | 'auto';
  createdAt: Date;
  updatedAt: Date;
}
