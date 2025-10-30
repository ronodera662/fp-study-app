import { db } from './database';
import type { DailyStats, CategoryStats, OverallStats } from '../types';
import { formatDateToString, calculateAccuracy, generateId } from '../utils/helpers';
import { CATEGORIES } from '../constants/categories';

export const statisticsService = {
  // 今日の統計を取得
  async getTodayStats(): Promise<DailyStats | undefined> {
    const today = formatDateToString(new Date());
    return await db.dailyStats.where('date').equals(today).first();
  },

  // 日別統計の更新
  async updateDailyStats(
    questionsSolved: number,
    correctAnswers: number,
    studyTimeMinutes: number
  ): Promise<void> {
    const today = formatDateToString(new Date());
    const existing = await this.getTodayStats();

    if (existing) {
      await db.dailyStats.update(existing.id, {
        questionsSolved: existing.questionsSolved + questionsSolved,
        correctAnswers: existing.correctAnswers + correctAnswers,
        studyTimeMinutes: existing.studyTimeMinutes + studyTimeMinutes,
        sessionsCount: existing.sessionsCount + 1,
      });
    } else {
      await db.dailyStats.add({
        id: generateId(),
        date: today,
        questionsSolved,
        correctAnswers,
        studyTimeMinutes,
        sessionsCount: 1,
      });
    }
  },

  // 週間統計取得
  async getWeeklyStats(startDate: Date): Promise<DailyStats[]> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const start = formatDateToString(startDate);
    const end = formatDateToString(endDate);

    return await db.dailyStats
      .where('date')
      .between(start, end, true, false)
      .toArray();
  },

  // カテゴリ別統計計算
  async getCategoryStats(): Promise<CategoryStats[]> {
    const answers = await db.userAnswers.toArray();
    const questions = await db.questions.toArray();

    const categoryMap = new Map<string, CategoryStats>();

    // 各カテゴリの初期化
    CATEGORIES.forEach((cat) => {
      categoryMap.set(cat.id, {
        category: cat.name,
        totalQuestions: 0,
        answeredQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
      });
    });

    // 問題数をカウント
    questions.forEach((q) => {
      const stat = categoryMap.get(q.category);
      if (stat) {
        stat.totalQuestions++;
      }
    });

    // 解答状況を集計
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const answeredQuestions = new Set<string>();

    answers.forEach((answer) => {
      const question = questionMap.get(answer.questionId);
      if (question) {
        const stat = categoryMap.get(question.category);
        if (stat) {
          answeredQuestions.add(answer.questionId);
          if (answer.isCorrect) {
            stat.correctAnswers++;
          }
        }
      }
    });

    // 解答済み問題数を集計
    answeredQuestions.forEach((qId) => {
      const question = questionMap.get(qId);
      if (question) {
        const stat = categoryMap.get(question.category);
        if (stat) {
          stat.answeredQuestions++;
        }
      }
    });

    // 正答率を計算
    categoryMap.forEach((stat) => {
      if (stat.answeredQuestions > 0) {
        stat.accuracy = calculateAccuracy(stat.correctAnswers, stat.answeredQuestions);
      }
    });

    return Array.from(categoryMap.values());
  },

  // 全体統計計算
  async getOverallStats(): Promise<OverallStats> {
    const answers = await db.userAnswers.toArray();
    const dailyStats = await db.dailyStats.orderBy('date').toArray();

    // 総問題数
    const totalQuestionsSolved = answers.length;

    // 正答率
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const overallAccuracy = calculateAccuracy(correctAnswers, totalQuestionsSolved);

    // 総学習時間
    const totalStudyTimeMinutes = dailyStats.reduce(
      (sum, stat) => sum + stat.studyTimeMinutes,
      0
    );

    // ストリーク計算
    const streaks = this.calculateStreaks(dailyStats);

    return {
      totalQuestionsSolved,
      overallAccuracy,
      totalStudyTimeMinutes,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
    };
  },

  // 学習継続日数（ストリーク）の計算
  calculateStreaks(dailyStats: DailyStats[]): { current: number; longest: number } {
    if (dailyStats.length === 0) {
      return { current: 0, longest: 0 };
    }

    const today = formatDateToString(new Date());
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // 日付順にソート
    const sorted = dailyStats
      .filter((s) => s.questionsSolved > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (sorted.length === 0) {
      return { current: 0, longest: 0 };
    }

    // 連続日数を計算
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sorted[i - 1].date);
        const currDate = new Date(sorted[i].date);
        const diffDays = Math.floor(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);

      // 現在のストリーク計算（最新の日付が今日か昨日の場合）
      const lastDate = new Date(sorted[i].date);
      const todayDate = new Date(today);
      const daysDiff = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 1 && i === sorted.length - 1) {
        currentStreak = tempStreak;
      }
    }

    return { current: currentStreak, longest: longestStreak };
  },
};
