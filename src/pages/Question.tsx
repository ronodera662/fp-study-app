import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useStudyStore } from '../store/studyStore';
import { ROUTES } from '../constants/routes';

export const Question: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentSession,
    getCurrentQuestion,
    answerQuestion,
    nextQuestion,
    isLastQuestion,
    endSession,
  } = useStudyStore();

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuestion = getCurrentQuestion();

  useEffect(() => {
    if (!currentSession) {
      navigate(ROUTES.STUDY_MODE);
    }
  }, [currentSession, navigate]);

  useEffect(() => {
    // Reset state when question changes
    setSelectedAnswer(null);
    setShowExplanation(false);
    setIsAnswered(false);
  }, [currentQuestion?.id]);

  if (!currentSession || !currentQuestion) {
    return null;
  }

  const handleSelectAnswer = (index: number) => {
    if (!isAnswered) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) {
      alert('解答を選択してください');
      return;
    }

    await answerQuestion(selectedAnswer);
    setIsAnswered(true);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (isLastQuestion()) {
      // 最後の問題なので結果画面へ
      endSession();
      navigate(ROUTES.RESULT);
    } else {
      nextQuestion();
    }
  };

  const progress = currentSession.currentIndex + 1;
  const total = currentSession.questions.length;
  const isCorrect = isAnswered && selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="space-y-6 pb-8">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          問題 {progress} / {total}
        </h2>
        <div className="text-sm text-gray-600">
          {currentQuestion.category}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(progress / total) * 100}%` }}
        ></div>
      </div>

      {/* Question */}
      <Card>
        <div className="space-y-4">
          <p className="text-lg font-medium">{currentQuestion.questionText}</p>

          {/* Options */}
          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => {
              let optionClass =
                'w-full p-4 text-left border-2 rounded-lg transition-colors ';

              if (isAnswered) {
                if (index === currentQuestion.correctAnswer) {
                  optionClass += 'border-green-500 bg-green-50';
                } else if (index === selectedAnswer) {
                  optionClass += 'border-red-500 bg-red-50';
                } else {
                  optionClass += 'border-gray-300 bg-gray-50';
                }
              } else {
                if (selectedAnswer === index) {
                  optionClass += 'border-blue-600 bg-blue-50';
                } else {
                  optionClass += 'border-gray-300 hover:border-blue-400';
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  className={optionClass}
                  disabled={isAnswered}
                >
                  <span className="font-medium mr-2">
                    {index + 1}.
                  </span>
                  {option}
                </button>
              );
            })}
          </div>

          {/* Answer Button */}
          {!isAnswered && (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
            >
              解答する
            </Button>
          )}

          {/* Explanation */}
          {showExplanation && (
            <div
              className={`p-4 rounded-lg ${
                isCorrect ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
              }`}
            >
              <p className="font-bold text-lg mb-2">
                {isCorrect ? '正解！' : '不正解'}
              </p>
              <p className="text-gray-700">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <Button variant="primary" size="lg" className="w-full" onClick={handleNext}>
              {isLastQuestion() ? '結果を見る' : '次の問題へ'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
