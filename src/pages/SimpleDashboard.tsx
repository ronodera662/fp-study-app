import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { db } from '../services/database';
import { statisticsService } from '../services/statisticsService';
import type { UserSettings } from '../types';

export const SimpleDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [todayStats, setTodayStats] = useState({ total: 0, correct: 0 });
  const [overallStats, setOverallStats] = useState({ total: 0, correct: 0, accuracy: 0 });
  const [questionCount, setQuestionCount] = useState(0);
  const [daysUntilExam, setDaysUntilExam] = useState<number | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // 設定を読み込み
    const allSettings = await db.userSettings.toArray();
    if (allSettings.length > 0) {
      const userSettings = allSettings[0];
      setSettings(userSettings);

      // 試験日までの日数を計算
      if (userSettings.examDate) {
        const examDate = new Date(userSettings.examDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        examDate.setHours(0, 0, 0, 0);
        const diffTime = examDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysUntilExam(diffDays);
      }
    }

    // 今日の統計を取得
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAnswers = await db.userAnswers
      .where('answeredAt')
      .above(today)
      .toArray();

    const todayCorrect = todayAnswers.filter(a => a.isCorrect).length;
    setTodayStats({
      total: todayAnswers.length,
      correct: todayCorrect,
    });

    // 全体の統計を取得
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

    // 問題数を取得
    const count = await db.questions.count();
    setQuestionCount(count);
  };

  const getDailyGoalProgress = () => {
    if (!settings?.dailyGoal) return 0;
    return Math.round((todayStats.total / settings.dailyGoal) * 100);
  };

  const getExamCountdownColor = () => {
    if (daysUntilExam === null) return 'text-gray-600';
    if (daysUntilExam < 0) return 'text-red-600';
    if (daysUntilExam <= 7) return 'text-orange-600';
    if (daysUntilExam <= 30) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getExamCountdownMessage = () => {
    if (daysUntilExam === null) return '試験日を設定してください';
    if (daysUntilExam < 0) return `試験日を${Math.abs(daysUntilExam)}日過ぎています`;
    if (daysUntilExam === 0) return '今日が試験日です！';
    return `試験まであと${daysUntilExam}日`;
  };

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-3xl font-bold text-gray-900">ダッシュボード</h2>

      {/* 試験日カウントダウン */}
      {settings?.examDate && (
        <Card title="試験日カウントダウン">
          <div className="text-center">
            <p className={`text-5xl font-bold ${getExamCountdownColor()}`}>
              {daysUntilExam !== null && daysUntilExam >= 0 ? daysUntilExam : '-'}
            </p>
            <p className="text-gray-900 mt-2 font-medium">{getExamCountdownMessage()}</p>
            {settings.examDate && (
              <p className="text-sm text-gray-800 mt-1">
                試験日: {new Date(settings.examDate).toLocaleDateString('ja-JP')}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* 今日の学習 */}
      <Card title="今日の学習">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border-2 border-gray-300">
              <p className="text-gray-900 text-sm font-bold">解いた問題数</p>
              <p className="text-3xl font-bold text-gray-900">{todayStats.total}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border-2 border-gray-300">
              <p className="text-gray-900 text-sm font-bold">正解数</p>
              <p className="text-3xl font-bold text-gray-900">{todayStats.correct}</p>
            </div>
          </div>

          {settings?.dailyGoal && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-900 font-medium">今日の目標</span>
                <span className="font-bold text-gray-900">
                  {todayStats.total} / {settings.dailyGoal}問
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getDailyGoalProgress(), 100)}%` }}
                ></div>
              </div>
              {todayStats.total >= settings.dailyGoal && (
                <p className="text-gray-900 text-sm mt-2 font-bold">
                  ✓ 目標達成！
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* 全体の統計 */}
      <Card title="全体の統計">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border-2 border-gray-300">
            <p className="text-gray-900 text-sm font-bold">登録問題数</p>
            <p className="text-2xl font-bold text-gray-900">{questionCount}</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border-2 border-gray-300">
            <p className="text-gray-900 text-sm font-bold">総解答数</p>
            <p className="text-2xl font-bold text-gray-900">{overallStats.total}</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border-2 border-gray-300">
            <p className="text-gray-900 text-sm font-bold">正解数</p>
            <p className="text-2xl font-bold text-gray-900">{overallStats.correct}</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border-2 border-gray-300">
            <p className="text-gray-900 text-sm font-bold">正答率</p>
            <p className="text-2xl font-bold text-gray-900">{overallStats.accuracy}%</p>
          </div>
        </div>
      </Card>

      {/* クイックアクション */}
      <Card title="学習を始める">
        {questionCount === 0 ? (
          <div className="space-y-4">
            <p className="text-gray-900 font-medium">
              まず「設定」タブから問題データをインポートしてください。
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/settings')}
            >
              設定画面へ
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/study/mode')}
            >
              学習モードを選択
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/progress')}
              >
                進捗を見る
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/settings')}
              >
                設定
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
