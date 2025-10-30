// 問題型定義
export interface Question {
  id: string;
  grade: '3' | '2';
  year: number;
  session: '5月' | '9月' | '1月';
  category: string;
  subcategory: string;
  questionType: 'true-false' | 'multiple-choice' | 'calculation';
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
