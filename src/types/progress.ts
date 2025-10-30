// ユーザー進捗型定義
export interface UserProgress {
  id: string;
  questionId: string;
  masteryLevel: 0 | 1 | 2 | 3;
  correctCount: number;
  totalAttempts: number;
  lastAnsweredAt?: Date;
  isBookmarked: boolean;
  userNotes?: string;
}

// 習熟度の定義
// 0: 未学習（一度も解答していない）
// 1: 初見（1回解答、正誤問わず）
// 2: 復習中（2回以上解答、まだマスターしていない）
// 3: マスター（連続2回以上正解）
