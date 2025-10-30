import { db } from './database';
import type { Question } from '../types';
import { shuffleArray } from '../utils/helpers';

export const questionService = {
  // 全問題取得
  async getAll(): Promise<Question[]> {
    return await db.questions.toArray();
  },

  // 問題数取得
  async count(): Promise<number> {
    return await db.questions.count();
  },

  // ランダムに問題を取得
  async getRandomQuestions(
    count: number,
    excludeIds: string[] = [],
    grade?: '3' | '2'
  ): Promise<Question[]> {
    let query = db.questions.toCollection();

    // 級でフィルタリング
    if (grade) {
      query = db.questions.where('grade').equals(grade);
    }

    const allQuestions = await query.toArray();
    const filteredQuestions = allQuestions.filter(
      (q) => !excludeIds.includes(q.id)
    );

    return shuffleArray(filteredQuestions).slice(0, count);
  },

  // カテゴリ別問題取得
  async getQuestionsByCategory(
    category: string,
    count: number,
    grade?: '3' | '2'
  ): Promise<Question[]> {
    let query = db.questions.where('category').equals(category);

    if (grade) {
      const allQuestions = await query.toArray();
      const filteredByGrade = allQuestions.filter((q) => q.grade === grade);
      return shuffleArray(filteredByGrade).slice(0, count);
    }

    const questions = await query.toArray();
    return shuffleArray(questions).slice(0, count);
  },

  // 年度別問題取得
  async getQuestionsByYear(
    year: number,
    grade?: '3' | '2'
  ): Promise<Question[]> {
    let query = db.questions.where('year').equals(year);

    if (grade) {
      const allQuestions = await query.toArray();
      return allQuestions.filter((q) => q.grade === grade);
    }

    return await query.toArray();
  },

  // 弱点問題取得（習熟度3未満または正答率60%未満）
  async getWeakQuestions(count: number, grade?: '3' | '2'): Promise<Question[]> {
    const allProgress = await db.userProgress.toArray();

    // 習熟度が3未満、または正答率が60%未満の問題を抽出
    const weakQuestionIds = allProgress
      .filter((p) => {
        if (p.totalAttempts === 0) return false; // 未解答は除外
        const accuracy = p.correctCount / p.totalAttempts;
        return p.masteryLevel < 3 || accuracy < 0.6;
      })
      .map((p) => p.questionId);

    if (weakQuestionIds.length === 0) {
      // 弱点問題がない場合はランダムに返す
      return this.getRandomQuestions(count, [], grade);
    }

    let questions = await db.questions
      .where('id')
      .anyOf(weakQuestionIds)
      .toArray();

    if (grade) {
      questions = questions.filter((q) => q.grade === grade);
    }

    // 正答率が低い順にソート
    const questionsWithProgress = questions.map(q => {
      const progress = allProgress.find(p => p.questionId === q.id);
      const accuracy = progress ? progress.correctCount / progress.totalAttempts : 0;
      return { question: q, accuracy, masteryLevel: progress?.masteryLevel || 0 };
    });

    questionsWithProgress.sort((a, b) => {
      // 習熟度が低い順、次に正答率が低い順
      if (a.masteryLevel !== b.masteryLevel) {
        return a.masteryLevel - b.masteryLevel;
      }
      return a.accuracy - b.accuracy;
    });

    return shuffleArray(questionsWithProgress.map(item => item.question)).slice(0, count);
  },

  // ブックマーク問題取得
  async getBookmarkedQuestions(count?: number, grade?: '3' | '2'): Promise<Question[]> {
    // 全てのprogressを取得してブックマーク済みのものをフィルタリング
    const allProgress = await db.userProgress.toArray();
    const bookmarked = allProgress.filter(p => p.isBookmarked === true);

    const questionIds = bookmarked.map((p) => p.questionId);

    if (questionIds.length === 0) {
      return [];
    }

    let questions = await db.questions
      .where('id')
      .anyOf(questionIds)
      .toArray();

    if (grade) {
      questions = questions.filter((q) => q.grade === grade);
    }

    const shuffled = shuffleArray(questions);
    return count ? shuffled.slice(0, count) : shuffled;
  },

  // 不正解問題取得（本日分のみ）
  async getIncorrectQuestions(count: number, grade?: '3' | '2'): Promise<Question[]> {
    // 今日の開始時刻を取得
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 全ての解答を取得して本日の不正解のみをフィルタリング
    const allAnswers = await db.userAnswers.toArray();
    const todayIncorrectAnswers = allAnswers.filter(a => {
      const answeredAt = new Date(a.answeredAt);
      return !a.isCorrect && answeredAt >= today;
    });

    if (todayIncorrectAnswers.length === 0) {
      return [];
    }

    // 問題IDをユニークにする
    const uniqueQuestionIds = [...new Set(todayIncorrectAnswers.map(a => a.questionId))];

    let questions = await db.questions
      .where('id')
      .anyOf(uniqueQuestionIds)
      .toArray();

    if (grade) {
      questions = questions.filter((q) => q.grade === grade);
    }

    return shuffleArray(questions).slice(0, count);
  },

  // 問題のインポート
  async importQuestions(questions: Question[]): Promise<void> {
    await db.questions.bulkPut(questions);
  },

  // 問題の削除（開発用）
  async deleteAll(): Promise<void> {
    await db.questions.clear();
  },
};
