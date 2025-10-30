import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { questionService } from '../services/questionService';
import { CATEGORIES } from '../constants/categories';

export const SimpleStudyMode: React.FC = () => {
  const navigate = useNavigate();
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartRandom = async () => {
    setIsLoading(true);
    try {
      const questions = await questionService.getRandomQuestions(questionCount, []);
      if (questions.length === 0) {
        alert('問題データがありません。設定画面からサンプルデータをインポートしてください。');
        return;
      }
      sessionStorage.setItem('currentQuestions', JSON.stringify(questions));
      sessionStorage.setItem('currentIndex', '0');
      navigate('/study/questions');
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
        questionCount
      );
      if (questions.length === 0) {
        alert('選択した分野の問題がありません。');
        return;
      }
      sessionStorage.setItem('currentQuestions', JSON.stringify(questions));
      sessionStorage.setItem('currentIndex', '0');
      navigate('/study/questions');
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
      const questions = await questionService.getWeakQuestions(questionCount);
      if (questions.length === 0) {
        alert('弱点問題がありません。まずは問題を解いてみましょう。');
        return;
      }
      sessionStorage.setItem('currentQuestions', JSON.stringify(questions));
      sessionStorage.setItem('currentIndex', '0');
      navigate('/study/questions');
    } catch (error) {
      console.error('Failed to load questions:', error);
      alert('問題の読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartBookmarked = async () => {
    setIsLoading(true);
    try {
      const questions = await questionService.getBookmarkedQuestions(questionCount);
      if (questions.length === 0) {
        alert('ブックマークした問題がありません。問題画面でブックマークを追加してください。');
        return;
      }
      sessionStorage.setItem('currentQuestions', JSON.stringify(questions));
      sessionStorage.setItem('currentIndex', '0');
      navigate('/study/questions');
    } catch (error) {
      console.error('Failed to load questions:', error);
      alert('問題の読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartIncorrect = async () => {
    setIsLoading(true);
    try {
      const questions = await questionService.getIncorrectQuestions(questionCount);
      if (questions.length === 0) {
        alert('本日間違えた問題がありません。もしくは全問正解しています！');
        return;
      }
      sessionStorage.setItem('currentQuestions', JSON.stringify(questions));
      sessionStorage.setItem('currentIndex', '0');
      navigate('/study/questions');
    } catch (error) {
      console.error('Failed to load questions:', error);
      alert('問題の読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-3xl font-bold text-gray-900">学習モード選択</h2>

      <Card title="出題数を選択">
        <div className="flex gap-2">
          {[10, 20, 30, 50].map((count) => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              className={`flex-1 py-2 rounded-lg font-bold transition-colors border-2 ${
                questionCount === count
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-900 border-gray-300 hover:border-blue-600'
              }`}
            >
              {count}問
            </button>
          ))}
        </div>
      </Card>

      <Card title="ランダム出題">
        <p className="text-gray-900 mb-4 font-medium">全問題からランダムに出題します</p>
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

      <Card title="分野別学習">
        <p className="text-gray-900 mb-4 font-medium">特定の分野を集中的に学習します</p>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-3 border-2 border-gray-300 rounded-lg mb-4 text-gray-900 font-medium focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
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

      <Card title="苦手克服モード">
        <p className="text-gray-900 mb-4 font-medium">正答率の低い問題を優先的に出題します</p>
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

      <Card title="ブックマーク復習">
        <p className="text-gray-900 mb-4 font-medium">ブックマークした問題を復習します</p>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleStartBookmarked}
          disabled={isLoading}
        >
          {isLoading ? '読み込み中...' : 'ブックマーク復習を開始'}
        </Button>
      </Card>

      <Card title="本日の不正解問題">
        <p className="text-gray-900 mb-4 font-medium">本日間違えた問題を復習します</p>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleStartIncorrect}
          disabled={isLoading}
        >
          {isLoading ? '読み込み中...' : '本日の不正解問題を復習'}
        </Button>
      </Card>
    </div>
  );
};
