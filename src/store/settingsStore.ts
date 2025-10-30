import { create } from 'zustand';
import { db } from '../services/database';
import type { UserSettings } from '../types';
import { generateId } from '../utils/helpers';
import { APP_CONFIG } from '../constants/config';

interface SettingsState {
  settings: UserSettings | null;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  setExamDate: (date: Date | undefined) => Promise<void>;
  setDailyGoal: (goal: number) => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'auto') => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await db.userSettings.toArray();
      if (settings.length > 0) {
        set({ settings: settings[0], isLoading: false });
      } else {
        // デフォルト設定を作成
        const defaultSettings: UserSettings = {
          id: generateId(),
          targetGrade: '3',
          dailyGoal: APP_CONFIG.defaultDailyGoal,
          reminderEnabled: false,
          theme: APP_CONFIG.defaultTheme,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.userSettings.add(defaultSettings);
        set({ settings: defaultSettings, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  updateSettings: async (updates: Partial<UserSettings>) => {
    const { settings } = get();
    if (!settings) return;

    const updatedSettings = {
      ...settings,
      ...updates,
      updatedAt: new Date(),
    };

    await db.userSettings.update(settings.id, updatedSettings);
    set({ settings: updatedSettings });
  },

  setExamDate: async (date: Date | undefined) => {
    await get().updateSettings({ examDate: date });
  },

  setDailyGoal: async (goal: number) => {
    await get().updateSettings({ dailyGoal: goal });
  },

  setTheme: async (theme: 'light' | 'dark' | 'auto') => {
    await get().updateSettings({ theme });
  },
}));
