import { db } from './database';
import type { UserProgress } from '../types';
import { generateId } from '../utils/helpers';

export const progressService = {
  // 進捗の取得
  async getProgress(questionId: string): Promise<UserProgress | undefined> {
    return await db.userProgress.where('questionId').equals(questionId).first();
  },

  // 全進捗取得
  async getAllProgress(): Promise<UserProgress[]> {
    return await db.userProgress.toArray();
  },

  // 進捗の更新
  async updateProgress(questionId: string, isCorrect: boolean): Promise<void> {
    const progress = await this.getProgress(questionId);

    if (progress) {
      // 既存の進捗を更新
      const newMasteryLevel = this.calculateMasteryLevel(progress, isCorrect);

      await db.userProgress.update(progress.id, {
        totalAttempts: progress.totalAttempts + 1,
        correctCount: isCorrect ? progress.correctCount + 1 : progress.correctCount,
        masteryLevel: newMasteryLevel,
        lastAnsweredAt: new Date(),
      });
    } else {
      // 新規進捗作成（初回解答時）
      const initialMasteryLevel = this.calculateMasteryLevel(
        {
          id: generateId(),
          questionId,
          masteryLevel: 0,
          correctCount: 0,
          totalAttempts: 0,
          lastAnsweredAt: new Date(),
          isBookmarked: false,
        },
        isCorrect
      );

      await db.userProgress.add({
        id: generateId(),
        questionId,
        masteryLevel: initialMasteryLevel,
        correctCount: isCorrect ? 1 : 0,
        totalAttempts: 1,
        lastAnsweredAt: new Date(),
        isBookmarked: false,
      });
    }
  },

  // 習熟度の計算（0-5の6段階）
  calculateMasteryLevel(progress: UserProgress, isCorrect: boolean): number {
    const { totalAttempts, correctCount } = progress;

    // 新しい回答を加味した統計
    const newTotalAttempts = totalAttempts + 1;
    const newCorrectCount = isCorrect ? correctCount + 1 : correctCount;
    const accuracy = newCorrectCount / newTotalAttempts;

    // 未解答
    if (newTotalAttempts === 0) {
      return 0;
    }

    // 習得済み（レベル5）: 5回以上正解 & 正答率90%以上
    if (newCorrectCount >= 5 && accuracy >= 0.9) {
      return 5;
    }

    // 習得済み（レベル4）: 3回以上正解 & 正答率80%以上
    if (newCorrectCount >= 3 && accuracy >= 0.8) {
      return 4;
    }

    // 理解（レベル3）: 2回以上正解 & 正答率60%以上
    if (newCorrectCount >= 2 && accuracy >= 0.6) {
      return 3;
    }

    // 学習中（レベル2）: 2回以上解答 & 正答率40%以上
    if (newTotalAttempts >= 2 && accuracy >= 0.4) {
      return 2;
    }

    // 学習中（レベル1）: 1回以上解答
    if (newTotalAttempts >= 1) {
      return 1;
    }

    // 未学習
    return 0;
  },

  // ブックマークの切り替え
  async toggleBookmark(questionId: string): Promise<void> {
    const progress = await this.getProgress(questionId);

    if (progress) {
      await db.userProgress.update(progress.id, {
        isBookmarked: !progress.isBookmarked,
      });
    } else {
      // 進捗がない場合は新規作成してブックマーク
      await db.userProgress.add({
        id: generateId(),
        questionId,
        masteryLevel: 0,
        correctCount: 0,
        totalAttempts: 0,
        isBookmarked: true,
      });
    }
  },

  // メモの更新
  async updateNotes(questionId: string, notes: string): Promise<void> {
    const progress = await this.getProgress(questionId);

    if (progress) {
      await db.userProgress.update(progress.id, {
        userNotes: notes,
      });
    } else {
      // 進捗がない場合は新規作成してメモを保存
      await db.userProgress.add({
        id: generateId(),
        questionId,
        masteryLevel: 0,
        correctCount: 0,
        totalAttempts: 0,
        isBookmarked: false,
        userNotes: notes,
      });
    }
  },

  // 習熟度別の問題数取得
  async getMasteryStats(): Promise<Record<number, number>> {
    const allProgress = await db.userProgress.toArray();
    const stats = { 0: 0, 1: 0, 2: 0, 3: 0 };

    allProgress.forEach((p) => {
      stats[p.masteryLevel]++;
    });

    return stats;
  },
};
