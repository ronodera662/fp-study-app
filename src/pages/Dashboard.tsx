import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { statisticsService } from '../services/statisticsService';
import { useSettingsStore } from '../store/settingsStore';
import { ROUTES } from '../constants/routes';
import type { OverallStats } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const [stats, setStats] = useState<OverallStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const overallStats = await statisticsService.getOverallStats();
    setStats(overallStats);
  };

  const daysUntilExam = settings?.examDate
    ? Math.ceil(
        (new Date(settings.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-3xl font-bold text-gray-800">ダッシュボード</h2>

      {/* Exam Countdown */}
      {settings?.examDate && (
        <Card>
          <div className="text-center">
            <p className="text-gray-600 mb-2">試験日まで</p>
            <p className="text-5xl font-bold text-blue-600">{daysUntilExam}</p>
            <p className="text-gray-600 mt-2">日</p>
          </div>
        </Card>
      )}

      {/* Quick Start */}
      <Card title="学習を始める">
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate(ROUTES.STUDY_MODE)}
          >
            学習モードを選択
          </Button>
        </div>
      </Card>

      {/* Statistics */}
      {stats && (
        <Card title="学習統計">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-600 text-sm">総問題数</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalQuestionsSolved}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-gray-600 text-sm">正答率</p>
              <p className="text-3xl font-bold text-green-600">{stats.overallAccuracy}%</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-gray-600 text-sm">学習時間</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalStudyTimeMinutes}</p>
              <p className="text-gray-600 text-xs">分</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-gray-600 text-sm">連続日数</p>
              <p className="text-3xl font-bold text-orange-600">{stats.currentStreak}</p>
              <p className="text-gray-600 text-xs">日</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
