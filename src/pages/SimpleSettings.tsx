import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { questionService } from '../services/questionService';
import { db } from '../services/database';
import { generateId } from '../utils/helpers';
import type { UserSettings } from '../types';

interface QuestionFile {
  path: string;
  name: string;
  grade: string;
}

interface YearFiles {
  year: number;
  files: Map<string, QuestionFile>;
}

export const SimpleSettings: React.FC = () => {
  const [questionCount, setQuestionCount] = useState(0);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [targetGrade, setTargetGrade] = useState<'3' | '2'>('3');
  const [examDateStr, setExamDateStr] = useState('');
  const [dailyGoal, setDailyGoal] = useState(20);
  const [isImporting, setIsImporting] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<YearFiles[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadQuestionCount();
    loadSettings();
    scanAvailableFiles();
  }, []);

  const scanAvailableFiles = async () => {
    setIsScanning(true);
    const filesByYear = new Map<number, Map<string, QuestionFile>>();

    // 2023年から2025年まで、1月/5月/9月のファイルをチェック
    const years = [2023, 2024, 2025];
    const months = ['01', '05', '09'];

    for (const year of years) {
      const yearFiles = new Map<string, QuestionFile>();
      for (const month of months) {
        const path = `/data/fp2_${year}_${month}.json`;
        try {
          const response = await fetch(path);
          // ステータスコードが200で、Content-TypeがJSONであることを確認
          const contentType = response.headers.get('content-type');
          if (response.status === 200 && contentType?.includes('application/json')) {
            // さらに、実際にJSONとしてパースできるか確認
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              yearFiles.set(month, {
                path,
                name: `${parseInt(month)}月`,
                grade: '2'
              });
            }
          }
        } catch (error) {
          // ファイルが存在しない、またはJSONのパースに失敗した場合は無視
          console.log(`File not found or invalid: ${path}`);
        }
      }
      if (yearFiles.size > 0) {
        filesByYear.set(year, yearFiles);
      }
    }

    // データを保存（ここでは年ごとの構造を保持）
    // 年を降順でソート
    const sortedYears = Array.from(filesByYear.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, files]) => ({
        year,
        files
      }));

    setAvailableFiles(sortedYears);
    setIsScanning(false);
  };

  const loadQuestionCount = async () => {
    const count = await questionService.count();
    setQuestionCount(count);
  };

  const loadSettings = async () => {
    const allSettings = await db.userSettings.toArray();
    if (allSettings.length > 0) {
      const userSettings = allSettings[0];
      setSettings(userSettings);
      setTargetGrade(userSettings.targetGrade);
      setDailyGoal(userSettings.dailyGoal);
      if (userSettings.examDate) {
        const date = new Date(userSettings.examDate);
        setExamDateStr(date.toISOString().split('T')[0]);
      }
    }
  };

  const saveSettings = async () => {
    const examDate = examDateStr ? new Date(examDateStr) : undefined;

    if (settings) {
      await db.userSettings.update(settings.id, {
        targetGrade,
        examDate,
        dailyGoal,
        updatedAt: new Date(),
      });
    } else {
      await db.userSettings.add({
        id: generateId(),
        targetGrade,
        examDate,
        dailyGoal,
        reminderEnabled: false,
        theme: 'light',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await loadSettings();
    alert('設定を保存しました');
  };

  const handleImportData = async (filePath: string, fileName: string) => {
    setIsImporting(true);
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const questions = await response.json();

      const processedQuestions = questions.map((q: any) => ({
        ...q,
        createdAt: new Date(q.createdAt),
        updatedAt: new Date(q.updatedAt),
      }));

      await questionService.importQuestions(processedQuestions);
      await loadQuestionCount();
      alert(`${fileName}から${questions.length}問をインポートしました`);
    } catch (error) {
      console.error('Failed to import data:', error);
      alert(`${fileName}のインポートに失敗しました`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportAllData = async () => {
    if (!confirm('すべての問題ファイルをインポートしますか？')) {
      return;
    }

    setIsImporting(true);
    let totalImported = 0;
    let successCount = 0;

    for (const yearData of availableFiles) {
      for (const [, file] of yearData.files) {
        try {
          const response = await fetch(file.path);
          if (!response.ok) continue;

          const questions = await response.json();
          const processedQuestions = questions.map((q: any) => ({
            ...q,
            createdAt: new Date(q.createdAt),
            updatedAt: new Date(q.updatedAt),
          }));

          await questionService.importQuestions(processedQuestions);
          totalImported += questions.length;
          successCount++;
        } catch (error) {
          console.error(`Failed to import ${yearData.year}年${file.name}:`, error);
        }
      }
    }

    await loadQuestionCount();
    setIsImporting(false);
    alert(`${successCount}個のファイルから合計${totalImported}問をインポートしました`);
  };

  const handleClearHistory = async () => {
    if (!confirm('学習履歴とインポート済み問題データを削除してもよろしいですか？\nこの操作は取り消せません。\n※public/dataフォルダのJSONファイルは削除されません。')) {
      return;
    }

    try {
      // 学習履歴データを削除
      await db.userAnswers.clear();
      await db.userProgress.clear();
      await db.dailyStats.clear();

      // インポート済み問題データを削除
      await db.questions.clear();

      await loadQuestionCount();
      alert('学習履歴とインポート済み問題データを削除しました');
    } catch (error) {
      console.error('Failed to clear history:', error);
      alert('学習履歴の削除に失敗しました');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-3xl font-bold text-gray-800">設定</h2>

      <Card title="目標級">
        <div className="flex gap-4">
          <button
            onClick={() => setTargetGrade('3')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              targetGrade === '3'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            FP3級
          </button>
          <button
            onClick={() => setTargetGrade('2')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              targetGrade === '2'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            FP2級
          </button>
        </div>
      </Card>

      <Card title="試験日">
        <div className="space-y-3">
          <input
            type="date"
            value={examDateStr}
            onChange={(e) => setExamDateStr(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
      </Card>

      <Card title="1日の目標問題数">
        <div className="space-y-3">
          <input
            type="number"
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            min="1"
            max="100"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
      </Card>

      <Button variant="primary" size="lg" className="w-full" onClick={saveSettings}>
        設定を保存
      </Button>

      <Card title="問題データ">
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600">登録されている問題数</p>
            <p className="text-4xl font-bold text-blue-600 my-2">{questionCount}</p>
            <p className="text-gray-600 text-sm">問</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-900">問題ファイルをインポート</p>
              <button
                onClick={scanAvailableFiles}
                disabled={isScanning}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                {isScanning ? '検索中...' : '🔄 再読み込み'}
              </button>
            </div>
            <div className="space-y-4">
              {isScanning ? (
                <div className="text-center py-8 text-gray-600">
                  問題ファイルを検索しています...
                </div>
              ) : availableFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  問題ファイルが見つかりませんでした
                </div>
              ) : (
                availableFiles.map((yearData) => (
                  <div key={yearData.year} className="border-2 border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900">FP2級 {yearData.year}年</h3>
                      <span className="text-xs text-gray-700 font-medium">{yearData.files.size}回分</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from(yearData.files.entries()).map(([month, file]) => (
                        <button
                          key={month}
                          onClick={() => handleImportData(file.path, `FP2級 ${yearData.year}年${file.name}`)}
                          disabled={isImporting}
                          className="p-3 text-center border-2 border-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <p className="font-bold text-gray-900">{file.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full mt-4"
              onClick={handleImportAllData}
              disabled={isImporting}
            >
              {isImporting ? 'インポート中...' : 'すべてまとめてインポート'}
            </Button>
          </div>
        </div>
      </Card>

      <Card title="データの管理">
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>注意:</strong> このボタンを押すと、以下のデータがすべて削除されます：
            </p>
            <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc">
              <li>インポート済み問題データ（データベース内）</li>
              <li>解答履歴</li>
              <li>進捗データ</li>
              <li>ブックマーク</li>
              <li>日次統計</li>
            </ul>
            <p className="text-sm text-yellow-800 mt-2">
              この操作は取り消せません。
            </p>
          </div>
          <button
            onClick={handleClearHistory}
            className="w-full px-5 py-2.5 text-base rounded-xl font-semibold transition-all duration-200 border-2 border-red-600 text-red-600 bg-white hover:bg-red-600 hover:text-white active:scale-95"
          >
            学習履歴と問題データを削除
          </button>
        </div>
      </Card>
    </div>
  );
};
