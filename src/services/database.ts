import Dexie from 'dexie';
import type { Question, UserAnswer, UserProgress, UserSettings, DailyStats } from '../types';

// IndexedDBデータベースクラス
export class FPStudyDatabase extends Dexie {
  questions!: Dexie.Table<Question, string>;
  userAnswers!: Dexie.Table<UserAnswer, string>;
  userProgress!: Dexie.Table<UserProgress, string>;
  userSettings!: Dexie.Table<UserSettings, string>;
  dailyStats!: Dexie.Table<DailyStats, string>;

  constructor() {
    super('FPStudyApp');

    // スキーマ定義
    this.version(1).stores({
      questions: 'id, grade, category, year, difficulty',
      userAnswers: 'id, questionId, answeredAt, isCorrect',
      userProgress: 'id, questionId, masteryLevel, isBookmarked, lastAnsweredAt',
      userSettings: 'id',
      dailyStats: 'id, date',
    });
  }
}

// データベースインスタンスのエクスポート
export const db = new FPStudyDatabase();
