import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { db } from '../services/database';
import { progressService } from '../services/progressService';
import { generateId } from '../utils/helpers';
import type { Question, UserAnswer } from '../types';

export const SimpleQuestion: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const questionsData = sessionStorage.getItem('currentQuestions');
    const indexData = sessionStorage.getItem('currentIndex');

    if (!questionsData) {
      navigate('/study/mode');
      return;
    }

    setQuestions(JSON.parse(questionsData));
    setCurrentIndex(parseInt(indexData || '0'));
  }, [navigate]);

  useEffect(() => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setIsAnswered(false);
    loadBookmarkStatus();
  }, [currentIndex, questions]);

  const loadBookmarkStatus = async () => {
    if (questions.length === 0) return;
    const currentQuestion = questions[currentIndex];
    const progress = await db.userProgress.get(currentQuestion.id);
    setIsBookmarked(progress?.isBookmarked || false);
  };

  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIndex];

  const handleSelectAnswer = (index: number) => {
    if (!isAnswered) {
      setSelectedAnswer(index);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      const newBookmarkStatus = !isBookmarked;

      // 既存の進捗データを取得または新規作成
      let progress = await db.userProgress.get(currentQuestion.id);

      if (progress) {
        await db.userProgress.update(currentQuestion.id, {
          isBookmarked: newBookmarkStatus,
        });
      } else {
        await db.userProgress.add({
          id: currentQuestion.id,
          questionId: currentQuestion.id,
          masteryLevel: 0,
          correctCount: 0,
          totalAttempts: 0,
          lastAnsweredAt: new Date(),
          isBookmarked: newBookmarkStatus,
        });
      }

      setIsBookmarked(newBookmarkStatus);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) {
      alert('解答を選択してください');
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    // 解答データを保存
    const userAnswer: UserAnswer = {
      id: generateId(),
      questionId: currentQuestion.id,
      userAnswer: selectedAnswer,
      isCorrect,
      answeredAt: new Date(),
      mode: 'random',
    };

    try {
      await db.userAnswers.add(userAnswer);
      await progressService.updateProgress(currentQuestion.id, isCorrect);
      setAnswers([...answers, userAnswer]);
    } catch (error) {
      console.error('Failed to save answer:', error);
    }

    setIsAnswered(true);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      sessionStorage.setItem('currentIndex', nextIndex.toString());
    } else {
      // 最後の問題なので結果画面へ
      // answersステートには既に全ての解答が含まれているはず
      // ただし、ステートの更新が反映されていない場合に備えて確認
      let allAnswers = answers;
      if (answers.length < questions.length) {
        // ステートの更新がまだ反映されていない場合のみ追加
        allAnswers = [...answers, {
          id: generateId(),
          questionId: currentQuestion.id,
          userAnswer: selectedAnswer,
          isCorrect,
          answeredAt: new Date(),
          mode: 'random',
        }];
      }

      const correctCount = allAnswers.filter((a) => a.isCorrect).length;
      sessionStorage.setItem('sessionResults', JSON.stringify({
        total: questions.length,
        correct: correctCount,
        answers: allAnswers
      }));
      sessionStorage.removeItem('currentQuestions');
      sessionStorage.removeItem('currentIndex');
      navigate('/study/result');
    }
  };

  const progress = currentIndex + 1;
  const total = questions.length;
  const isCorrect = isAnswered && selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          問題 {progress} / {total}
        </h2>
        <button
          onClick={handleToggleBookmark}
          className={`p-2 rounded-lg transition-colors ${
            isBookmarked
              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
          title={isBookmarked ? 'ブックマーク解除' : 'ブックマーク'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill={isBookmarked ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(progress / total) * 100}%` }}
        ></div>
      </div>

      <Card>
        <div className="space-y-4">
          <p className="text-lg font-bold text-gray-900">{currentQuestion.questionText}</p>

          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => {
              let optionClass = 'w-full p-4 text-left border-2 rounded-lg transition-colors text-gray-900 font-medium ';

              if (isAnswered) {
                if (index === currentQuestion.correctAnswer) {
                  optionClass += 'border-green-600 bg-green-100';
                } else if (index === selectedAnswer) {
                  optionClass += 'border-red-600 bg-red-100';
                } else {
                  optionClass += 'border-gray-300 bg-white';
                }
              } else {
                if (selectedAnswer === index) {
                  optionClass += 'border-blue-600 bg-blue-100';
                } else {
                  optionClass += 'border-gray-300 bg-white hover:border-blue-600';
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  className={optionClass}
                  disabled={isAnswered}
                >
                  <span className="font-bold mr-2">{index + 1}.</span>
                  {option}
                </button>
              );
            })}
          </div>

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

          {showExplanation && (
            <div
              className={`p-4 rounded-lg ${
                isCorrect
                  ? 'bg-green-100 border-2 border-green-600'
                  : 'bg-red-100 border-2 border-red-600'
              }`}
            >
              <p className="font-bold text-xl mb-2 text-gray-900">{isCorrect ? '✓ 正解！' : '✗ 不正解'}</p>
              <p className="text-gray-900 font-medium">{currentQuestion.explanation}</p>
            </div>
          )}

          {isAnswered && (
            <Button variant="primary" size="lg" className="w-full" onClick={handleNext}>
              {currentIndex === questions.length - 1 ? 'ホームに戻る' : '次の問題へ'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
