// ユーザー進捗型定義
export interface UserProgress {
  id: string;
  questionId: string;
  masteryLevel: 0 | 1 | 2 | 3 | 4 | 5;
  correctCount: number;
  totalAttempts: number;
  lastAnsweredAt?: Date;
  isBookmarked: boolean;
  userNotes?: string;
}

// 習熟度の定義（0-5の6段階）
// 0: 未学習（一度も解答していない）
// 1: 学習中（1回以上解答）
// 2: 学習中（2回以上解答 & 正答率40%以上）
// 3: 理解（2回以上正解 & 正答率60%以上）
// 4: 習得済み（3回以上正解 & 正答率80%以上）
// 5: 完全習得（5回以上正解 & 正答率90%以上）
