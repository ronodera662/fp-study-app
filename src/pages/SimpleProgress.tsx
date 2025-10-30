import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { db } from '../services/database';
import { statisticsService } from '../services/statisticsService';
import { CATEGORIES } from '../constants/categories';
import type { UserAnswer } from '../types';

interface CategoryStats {
  categoryId: string;
  categoryName: string;
  total: number;
  correct: number;
  accuracy: number;
}

export const SimpleProgress: React.FC = () => {
  const [questionCount, setQuestionCount] = useState(0);
  const [overallStats, setOverallStats] = useState({ total: 0, correct: 0, accuracy: 0 });
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [recentAnswers, setRecentAnswers] = useState<UserAnswer[]>([]);
  const [masteryDistribution, setMasteryDistribution] = useState({
    mastered: 0,
    familiar: 0,
    learning: 0,
    new: 0,
  });
  const [weeklyActivity, setWeeklyActivity] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    // 登録問題数を取得
    const totalQuestionCount = await db.questions.count();
    setQuestionCount(totalQuestionCount);

    // 全体の統計
    const allAnswers = await db.userAnswers.toArray();
    const allCorrect = allAnswers.filter(a => a.isCorrect).length;
    const accuracy = allAnswers.length > 0
      ? Math.round((allCorrect / allAnswers.length) * 100)
      : 0;

    setOverallStats({
      total: allAnswers.length,
      correct: allCorrect,
      accuracy,
    });

    // 分野別統計
    const questions = await db.questions.toArray();
    const categoryStatsMap = new Map<string, { total: number; correct: number }>();

    for (const answer of allAnswers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      const existing = categoryStatsMap.get(question.category) || { total: 0, correct: 0 };
      existing.total += 1;
      if (answer.isCorrect) existing.correct += 1;
      categoryStatsMap.set(question.category, existing);
    }

    const categoryStatsArray: CategoryStats[] = Array.from(categoryStatsMap.entries()).map(
      ([categoryId, stats]) => {
        const category = CATEGORIES.find(c => c.id === categoryId);
        return {
          categoryId,
          categoryName: category?.name || categoryId,
          total: stats.total,
          correct: stats.correct,
          accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        };
      }
    );

    categoryStatsArray.sort((a, b) => b.total - a.total);
    setCategoryStats(categoryStatsArray);

    // 最近の解答履歴（最新20件）
    const recent = allAnswers
      .sort((a, b) => new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime())
      .slice(0, 20);
    setRecentAnswers(recent);

    // 習熟度分布
    const totalQuestions = await db.questions.count();
    const allProgress = await db.userProgress.toArray();

    const mastered = allProgress.filter(p => p.masteryLevel >= 4).length;  // レベル4-5: 習得済み
    const familiar = allProgress.filter(p => p.masteryLevel === 3).length; // レベル3: 理解
    const learning = allProgress.filter(p => p.masteryLevel >= 1 && p.masteryLevel <= 2).length; // レベル1-2: 学習中
    const studied = mastered + familiar + learning; // 学習済み問題数
    const newQuestions = totalQuestions - studied; // 未学習 = 全問題数 - 学習済み問題数

    const distribution = {
      mastered,
      familiar,
      learning,
      new: newQuestions,
    };
    setMasteryDistribution(distribution);

    // 過去7日間の活動
    const today = new Date();
    const weekActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayAnswers = allAnswers.filter(a => {
        const answeredAt = new Date(a.answeredAt);
        return answeredAt >= date && answeredAt < nextDay;
      });

      weekActivity.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        count: dayAnswers.length,
      });
    }
    setWeeklyActivity(weekActivity);
  };

  const getMasteryLevelText = (level: number): string => {
    if (level >= 5) return '完全習得';
    if (level === 4) return '習得済み';
    if (level === 3) return '理解';
    if (level >= 1) return '学習中';
    return '未学習';
  };

  const getMasteryLevelColor = (level: number): string => {
    if (level >= 5) return 'text-green-700';
    if (level === 4) return 'text-green-600';
    if (level === 3) return 'text-blue-600';
    if (level >= 1) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-blue-600';
    if (accuracy >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const maxWeeklyCount = Math.max(...weeklyActivity.map(d => d.count), 1);

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-3xl font-bold text-gray-900">進捗管理</h2>

      {/* 全体の統計 */}
      <Card title="全体の進捗">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border-2 border-gray-300">
            <p className="text-gray-900 text-sm mb-1 font-bold">登録問題数</p>
            <p className="text-2xl font-bold text-gray-900">{questionCount}</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border-2 border-gray-300">
            <p className="text-gray-900 text-sm mb-1 font-bold">総解答数</p>
            <p className="text-2xl font-bold text-gray-900">{overallStats.total}</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border-2 border-gray-300">
            <p className="text-gray-900 text-sm mb-1 font-bold">正解数</p>
            <p className="text-2xl font-bold text-gray-900">{overallStats.correct}</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border-2 border-gray-300">
            <p className="text-gray-900 text-sm mb-1 font-bold">正答率</p>
            <p className="text-2xl font-bold text-gray-900">
              {overallStats.accuracy}%
            </p>
          </div>
        </div>
      </Card>

      {/* 過去7日間の活動 */}
      <Card title="過去7日間の活動">
        <div className="space-y-2">
          <div className="flex items-end justify-between h-32 gap-2">
            {weeklyActivity.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center justify-end">
                <div className="text-xs text-gray-900 mb-1 font-bold">{day.count}</div>
                <div
                  className="w-full bg-blue-600 rounded-t"
                  style={{
                    height: `${(day.count / maxWeeklyCount) * 100}%`,
                    minHeight: day.count > 0 ? '8px' : '0',
                  }}
                ></div>
                <div className="text-xs text-gray-900 mt-2 font-medium">{day.date}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 習熟度分布 */}
      <Card title="習熟度分布">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-300">
            <div>
              <span className="font-bold text-gray-900">習得済み</span>
              <p className="text-xs text-gray-900 mt-1 font-medium">3回以上正解 & 正答率80%以上</p>
            </div>
            <span className="text-2xl font-bold text-gray-900">{masteryDistribution.mastered}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-300">
            <div>
              <span className="font-bold text-gray-900">理解</span>
              <p className="text-xs text-gray-900 mt-1 font-medium">2回以上正解 & 正答率60%以上</p>
            </div>
            <span className="text-2xl font-bold text-gray-900">{masteryDistribution.familiar}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-300">
            <div>
              <span className="font-bold text-gray-900">学習中</span>
              <p className="text-xs text-gray-900 mt-1 font-medium">解答済み & 正答率60%未満</p>
            </div>
            <span className="text-2xl font-bold text-gray-900">{masteryDistribution.learning}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-300">
            <div>
              <span className="font-bold text-gray-900">未学習</span>
              <p className="text-xs text-gray-900 mt-1 font-medium">未解答</p>
            </div>
            <span className="text-2xl font-bold text-gray-900">{masteryDistribution.new}</span>
          </div>
        </div>
      </Card>

      {/* 分野別統計 */}
      <Card title="分野別統計">
        {categoryStats.length === 0 ? (
          <p className="text-gray-900 text-center py-4 font-medium">
            まだ学習データがありません。問題を解いてみましょう。
          </p>
        ) : (
          <div className="space-y-3">
            {categoryStats.map((stat) => (
              <div key={stat.categoryId} className="border-b border-gray-200 pb-3 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-900">{stat.categoryName}</span>
                  <span className="font-bold text-gray-900">
                    {stat.accuracy}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                  <span>
                    {stat.correct} / {stat.total}問正解
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      stat.accuracy >= 80
                        ? 'bg-green-500'
                        : stat.accuracy >= 60
                        ? 'bg-blue-500'
                        : stat.accuracy >= 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${stat.accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 最近の学習履歴 */}
      <Card title="最近の学習履歴">
        {recentAnswers.length === 0 ? (
          <p className="text-gray-900 text-center py-4 font-medium">
            まだ学習データがありません。
          </p>
        ) : (
          <div className="space-y-2">
            {recentAnswers.slice(0, 10).map((answer) => (
              <div
                key={answer.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-300"
              >
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium">
                    {new Date(answer.answeredAt).toLocaleString('ja-JP', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  {answer.isCorrect ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-200 text-gray-900 border-2 border-gray-900">
                      正解
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-200 text-gray-900 border-2 border-gray-900">
                      不正解
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
