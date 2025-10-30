import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useStudyStore } from '../store/studyStore';
import { ROUTES } from '../constants/routes';

export const Result: React.FC = () => {
  const navigate = useNavigate();
  const { currentSession } = useStudyStore();

  if (!currentSession) {
    navigate(ROUTES.HOME);
    return null;
  }

  const totalQuestions = currentSession.answers.length;
  const correctAnswers = currentSession.answers.filter((a) => a.isCorrect).length;
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);

  const getMessage = () => {
    if (accuracy >= 80) return '素晴らしい！';
    if (accuracy >= 60) return '良い調子です！';
    if (accuracy >= 40) return 'もう少し頑張りましょう';
    return '復習が必要です';
  };

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-3xl font-bold text-gray-800 text-center">学習結果</h2>

      <Card>
        <div className="text-center space-y-6">
          {/* Accuracy */}
          <div>
            <p className="text-6xl font-bold text-blue-600">{accuracy}%</p>
            <p className="text-gray-600 mt-2">{getMessage()}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-600 text-sm">正解数</p>
              <p className="text-3xl font-bold text-blue-600">{correctAnswers}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">問題数</p>
              <p className="text-3xl font-bold text-gray-600">{totalQuestions}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate(ROUTES.STUDY_MODE)}
            >
              もう一度学習する
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => navigate(ROUTES.HOME)}
            >
              ホームに戻る
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
