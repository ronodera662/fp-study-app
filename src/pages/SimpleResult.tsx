import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { db } from '../services/database';
import { CATEGORIES } from '../constants/categories';
import type { UserAnswer, Question } from '../types';

interface SessionResult {
  total: number;
  correct: number;
  answers: UserAnswer[];
}

interface QuestionWithAnswer {
  question: Question;
  answer: UserAnswer;
}

interface CategoryResult {
  categoryId: string;
  categoryName: string;
  total: number;
  correct: number;
  accuracy: number;
}

export const SimpleResult: React.FC = () => {
  const navigate = useNavigate();
  const [total, setTotal] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState<QuestionWithAnswer[]>([]);
  const [categoryResults, setCategoryResults] = useState<CategoryResult[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadResults();
  }, [navigate]);

  const loadResults = async () => {
    const resultsData = sessionStorage.getItem('sessionResults');
    if (!resultsData) {
      navigate('/');
      return;
    }

    const results: SessionResult = JSON.parse(resultsData);
    setTotal(results.total);
    setCorrect(results.correct);

    // 問題データを取得
    const questionIds = results.answers.map(a => a.questionId);
    const questions = await db.questions.where('id').anyOf(questionIds).toArray();

    const questionsMap = new Map(questions.map(q => [q.id, q]));
    const qWithA: QuestionWithAnswer[] = results.answers
      .map(answer => {
        const question = questionsMap.get(answer.questionId);
        return question ? { question, answer } : null;
      })
      .filter((item): item is QuestionWithAnswer => item !== null);

    setQuestionsWithAnswers(qWithA);

    // 分野別の集計
    const categoryMap = new Map<string, { total: number; correct: number }>();

    qWithA.forEach(({ question, answer }) => {
      const existing = categoryMap.get(question.category) || { total: 0, correct: 0 };
      existing.total += 1;
      if (answer.isCorrect) existing.correct += 1;
      categoryMap.set(question.category, existing);
    });

    const categoryResultsArray: CategoryResult[] = Array.from(categoryMap.entries()).map(
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

    categoryResultsArray.sort((a, b) => b.total - a.total);
    setCategoryResults(categoryResultsArray);
  };

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const getMessage = () => {
    if (accuracy >= 80) return '素晴らしい！';
    if (accuracy >= 60) return '良い調子です！';
    if (accuracy >= 40) return 'もう少し頑張りましょう';
    return '復習が必要です';
  };

  const handleRetry = () => {
    sessionStorage.removeItem('sessionResults');
    navigate('/study/mode');
  };

  const handleHome = () => {
    sessionStorage.removeItem('sessionResults');
    navigate('/');
  };

  const incorrectQuestions = questionsWithAnswers.filter(item => !item.answer.isCorrect);

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-3xl font-bold text-gray-900 text-center">学習結果</h2>

      <Card>
        <div className="text-center space-y-6">
          {/* Accuracy */}
          <div>
            <p className="text-6xl font-bold text-gray-900">{accuracy}%</p>
            <p className="text-gray-900 mt-2 font-bold text-xl">{getMessage()}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border-2 border-gray-300">
              <p className="text-gray-900 text-sm font-bold">正解数</p>
              <p className="text-3xl font-bold text-gray-900">{correct}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-gray-300">
              <p className="text-gray-900 text-sm font-bold">問題数</p>
              <p className="text-3xl font-bold text-gray-900">{total}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button variant="primary" size="lg" className="w-full" onClick={handleRetry}>
              もう一度学習する
            </Button>
            <Button variant="primary" size="lg" className="w-full" onClick={handleHome}>
              ホームに戻る
            </Button>
          </div>
        </div>
      </Card>

      {/* Category-wise results */}
      {categoryResults.length > 0 && (
        <Card title="分野別結果">
          <div className="space-y-3">
            {categoryResults.map((cat) => (
              <div key={cat.categoryId} className="border-b border-gray-200 pb-3 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-900">{cat.categoryName}</span>
                  <span className="font-bold text-gray-900">
                    {cat.accuracy}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                  <span>
                    {cat.correct} / {cat.total}問正解
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      cat.accuracy >= 80
                        ? 'bg-green-500'
                        : cat.accuracy >= 60
                        ? 'bg-blue-500'
                        : cat.accuracy >= 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${cat.accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Incorrect questions */}
      {incorrectQuestions.length > 0 && (
        <Card title={`間違えた問題 (${incorrectQuestions.length}問)`}>
          <Button
            variant="primary"
            size="md"
            className="w-full mb-4"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '詳細を隠す' : '詳細を表示'}
          </Button>

          {showDetails && (
            <div className="space-y-4">
              {incorrectQuestions.map((item, index) => (
                <div key={item.answer.id} className="border-2 border-gray-300 bg-white rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-sm font-bold">
                      {index + 1}
                    </span>
                    <p className="flex-1 font-bold text-gray-900">
                      {item.question.questionText}
                    </p>
                  </div>
                  <div className="ml-8 space-y-2">
                    <div>
                      <span className="text-sm font-bold text-gray-900">あなたの解答: </span>
                      <span className="text-sm text-gray-900 font-medium">
                        {item.question.options[item.answer.userAnswer]}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-900">正解: </span>
                      <span className="text-sm text-gray-900 font-medium">
                        {item.question.options[item.question.correctAnswer]}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-gray-300">
                      <p className="text-sm font-bold text-gray-900 mb-1">解説:</p>
                      <p className="text-sm text-gray-900 font-medium">{item.question.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* All questions summary */}
      <Card title="全問題一覧">
        <div className="space-y-2">
          {questionsWithAnswers.map((item, index) => (
            <div
              key={item.answer.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white border-2 border-gray-300"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900">問{index + 1}</span>
                <span className="text-sm text-gray-900 font-medium truncate max-w-xs">
                  {item.question.questionText.substring(0, 40)}
                  {item.question.questionText.length > 40 ? '...' : ''}
                </span>
              </div>
              <div>
                {item.answer.isCorrect ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-200 text-gray-900 border-2 border-gray-900">
                    ○
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-200 text-gray-900 border-2 border-gray-900">
                    ×
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
