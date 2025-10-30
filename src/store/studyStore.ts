import { create } from 'zustand';
import type { Question, UserAnswer, StudyMode } from '../types';
import { generateId } from '../utils/helpers';
import { db } from '../services/database';
import { progressService } from '../services/progressService';
import { statisticsService } from '../services/statisticsService';

interface StudySession {
  questions: Question[];
  currentIndex: number;
  answers: UserAnswer[];
  startTime: Date;
  mode: StudyMode;
}

interface StudyState {
  currentSession: StudySession | null;
  isSessionActive: boolean;
  startSession: (mode: StudyMode, questions: Question[]) => void;
  answerQuestion: (answer: number) => Promise<void>;
  nextQuestion: () => void;
  endSession: () => Promise<void>;
  skipQuestion: () => void;
  getCurrentQuestion: () => Question | null;
  isLastQuestion: () => boolean;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  currentSession: null,
  isSessionActive: false,

  startSession: (mode: StudyMode, questions: Question[]) => {
    set({
      currentSession: {
        questions,
        currentIndex: 0,
        answers: [],
        startTime: new Date(),
        mode,
      },
      isSessionActive: true,
    });
  },

  answerQuestion: async (answer: number) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const currentQuestion = currentSession.questions[currentSession.currentIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;

    const userAnswer: UserAnswer = {
      id: generateId(),
      questionId: currentQuestion.id,
      userAnswer: answer,
      isCorrect,
      answeredAt: new Date(),
      mode: currentSession.mode,
    };

    // データベースに保存
    await db.userAnswers.add(userAnswer);

    // 進捗を更新
    await progressService.updateProgress(currentQuestion.id, isCorrect);

    // セッションに解答を追加
    set({
      currentSession: {
        ...currentSession,
        answers: [...currentSession.answers, userAnswer],
      },
    });
  },

  nextQuestion: () => {
    const { currentSession } = get();
    if (!currentSession) return;

    if (currentSession.currentIndex < currentSession.questions.length - 1) {
      set({
        currentSession: {
          ...currentSession,
          currentIndex: currentSession.currentIndex + 1,
        },
      });
    }
  },

  endSession: async () => {
    const { currentSession } = get();
    if (!currentSession) return;

    // 統計を更新
    const correctCount = currentSession.answers.filter((a) => a.isCorrect).length;
    const totalQuestions = currentSession.answers.length;
    const studyTimeMinutes = Math.ceil(
      (new Date().getTime() - currentSession.startTime.getTime()) / 60000
    );

    await statisticsService.updateDailyStats(
      totalQuestions,
      correctCount,
      studyTimeMinutes
    );

    set({ currentSession: null, isSessionActive: false });
  },

  skipQuestion: () => {
    get().nextQuestion();
  },

  getCurrentQuestion: () => {
    const { currentSession } = get();
    if (!currentSession) return null;
    return currentSession.questions[currentSession.currentIndex] || null;
  },

  isLastQuestion: () => {
    const { currentSession } = get();
    if (!currentSession) return false;
    return currentSession.currentIndex === currentSession.questions.length - 1;
  },
}));
