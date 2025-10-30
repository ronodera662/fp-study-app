import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useSettingsStore } from '../store/settingsStore';
import { useStudyStore } from '../store/studyStore';
import { questionService } from '../services/questionService';
import { ROUTES } from '../constants/routes';
import { CATEGORIES } from '../constants/categories';

export const StudyMode: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const { startSession } = useStudyStore();
  const [questionCount, setQuestionCount] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartRandom = async () => {
    setIsLoading(true);
    try {
      const questions = await questionService.getRandomQuestions(
        questionCount,
        [],
        settings?.targetGrade
      );
      if (questions.length === 0) {
        alert('問題データがありません。サンプルデータをインポートしてください。');
        return;
      }
      startSession('random', questions);
      navigate(ROUTES.QUESTION);
    } catch (error) {
      console.error('Failed to load questions:', error);
      alert('問題の読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCategory = async () => {
    if (!selectedCategory) {
      alert('分野を選択してください');
      return;
    }

    setIsLoading(true);
    try {
      const questions = await questionService.getQuestionsByCategory(
        selectedCategory,
        questionCount,
        settings?.targetGrade
      );
      if (questions.length === 0) {
        alert('選択した分野の問題がありません。');
        return;
      }
      startSession('category', questions);
      navigate(ROUTES.QUESTION);
    } catch (error) {
      console.error('Failed to load questions:', error);
      alert('問題の読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartWeakness = async () => {
    setIsLoading(true);
    try {
      const questions = await questionService.getWeakQuestions(
        questionCount,
        settings?.targetGrade
      );
      if (questions.length === 0) {
        alert('弱点問題がありません。まずは問題を解いてみましょう。');
        return;
      }
      startSession('weakness', questions);
      navigate(ROUTES.QUESTION);
    } catch (error) {
      console.error('Failed to load questions:', error);
      alert('問題の読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-3xl font-bold text-gray-800">学習モード選択</h2>

      {/* Question Count Selector */}
      <Card title="出題数を選択">
        <div className="flex gap-2">
          {[10, 20, 30, 50].map((count) => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                questionCount === count
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {count}問
            </button>
          ))}
        </div>
      </Card>

      {/* Random Mode */}
      <Card title="ランダム出題">
        <p className="text-gray-600 mb-4">全問題からランダムに出題します</p>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleStartRandom}
          disabled={isLoading}
        >
          {isLoading ? '読み込み中...' : 'ランダム出題を開始'}
        </Button>
      </Card>

      {/* Category Mode */}
      <Card title="分野別学習">
        <p className="text-gray-600 mb-4">特定の分野を集中的に学習します</p>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        >
          <option value="">分野を選択してください</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleStartCategory}
          disabled={isLoading}
        >
          {isLoading ? '読み込み中...' : '分野別学習を開始'}
        </Button>
      </Card>

      {/* Weakness Mode */}
      <Card title="苦手克服モード">
        <p className="text-gray-600 mb-4">正答率の低い問題を優先的に出題します</p>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleStartWeakness}
          disabled={isLoading}
        >
          {isLoading ? '読み込み中...' : '苦手克服を開始'}
        </Button>
      </Card>
    </div>
  );
};
