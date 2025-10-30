import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { statisticsService } from '../services/statisticsService';
import type { CategoryStats } from '../types';

export const Progress: React.FC = () => {
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const stats = await statisticsService.getCategoryStats();
    setCategoryStats(stats);
  };

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-3xl font-bold text-gray-800">進捗管理</h2>

      <Card title="分野別正答率">
        <div className="space-y-4">
          {categoryStats.map((stat) => (
            <div key={stat.category}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{stat.category}</span>
                <span className="text-sm font-medium text-gray-700">{stat.accuracy}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${stat.accuracy}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stat.answeredQuestions} / {stat.totalQuestions} 問
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
