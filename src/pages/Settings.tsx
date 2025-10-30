import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useSettingsStore } from '../store/settingsStore';
import { questionService } from '../services/questionService';

export const Settings: React.FC = () => {
  const { settings, updateSettings, setExamDate, setDailyGoal } = useSettingsStore();
  const [examDateStr, setExamDateStr] = useState('');
  const [dailyGoalValue, setDailyGoalValue] = useState(20);
  const [questionCount, setQuestionCount] = useState(0);

  useEffect(() => {
    if (settings) {
      setDailyGoalValue(settings.dailyGoal);
      if (settings.examDate) {
        const date = new Date(settings.examDate);
        setExamDateStr(date.toISOString().split('T')[0]);
      }
    }
    loadQuestionCount();
  }, [settings]);

  const loadQuestionCount = async () => {
    const count = await questionService.count();
    setQuestionCount(count);
  };

  const handleSaveExamDate = () => {
    if (examDateStr) {
      setExamDate(new Date(examDateStr));
      alert('試験日を設定しました');
    } else {
      setExamDate(undefined);
    }
  };

  const handleSaveDailyGoal = () => {
    setDailyGoal(dailyGoalValue);
    alert('目標を設定しました');
  };

  const handleGradeChange = (grade: '3' | '2') => {
    updateSettings({ targetGrade: grade });
  };

  const handleImportSampleData = async () => {
    try {
      const response = await fetch('/data/sample-questions.json');
      const questions = await response.json();

      // 日付文字列をDateオブジェクトに変換
      const processedQuestions = questions.map((q: any) => ({
        ...q,
        createdAt: new Date(q.createdAt),
        updatedAt: new Date(q.updatedAt),
      }));

      await questionService.importQuestions(processedQuestions);
      await loadQuestionCount();
      alert(`${questions.length}問のサンプルデータをインポートしました`);
    } catch (error) {
      console.error('Failed to import sample data:', error);
      alert('サンプルデータのインポートに失敗しました');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-3xl font-bold text-gray-800">設定</h2>

      {/* Target Grade */}
      <Card title="目標級">
        <div className="flex gap-4">
          <button
            onClick={() => handleGradeChange('3')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              settings?.targetGrade === '3'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            FP3級
          </button>
          <button
            onClick={() => handleGradeChange('2')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              settings?.targetGrade === '2'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            FP2級
          </button>
        </div>
      </Card>

      {/* Exam Date */}
      <Card title="試験日">
        <div className="space-y-3">
          <input
            type="date"
            value={examDateStr}
            onChange={(e) => setExamDateStr(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <Button variant="primary" size="md" className="w-full" onClick={handleSaveExamDate}>
            試験日を設定
          </Button>
        </div>
      </Card>

      {/* Daily Goal */}
      <Card title="1日の目標問題数">
        <div className="space-y-3">
          <input
            type="number"
            value={dailyGoalValue}
            onChange={(e) => setDailyGoalValue(Number(e.target.value))}
            min="1"
            max="100"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <Button variant="primary" size="md" className="w-full" onClick={handleSaveDailyGoal}>
            目標を設定
          </Button>
        </div>
      </Card>

      {/* Question Count */}
      <Card title="問題データ">
        <div className="text-center space-y-4">
          <div>
            <p className="text-gray-600">登録されている問題数</p>
            <p className="text-4xl font-bold text-blue-600 my-2">{questionCount}</p>
            <p className="text-gray-600 text-sm">問</p>
          </div>
          <Button
            variant="outline"
            size="md"
            className="w-full"
            onClick={handleImportSampleData}
          >
            サンプルデータをインポート
          </Button>
        </div>
      </Card>
    </div>
  );
};
