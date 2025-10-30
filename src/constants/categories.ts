// FP試験の6分野定義
export const CATEGORIES = [
  {
    id: 'life-planning',
    name: 'ライフプランニングと資金計画',
    shortName: 'ライフプランニング',
    color: '#3b82f6',
  },
  {
    id: 'risk-management',
    name: 'リスク管理',
    shortName: 'リスク管理',
    color: '#ef4444',
  },
  {
    id: 'financial-assets',
    name: '金融資産運用',
    shortName: '金融資産運用',
    color: '#10b981',
  },
  {
    id: 'tax-planning',
    name: 'タックスプランニング',
    shortName: 'タックス',
    color: '#f59e0b',
  },
  {
    id: 'real-estate',
    name: '不動産',
    shortName: '不動産',
    color: '#8b5cf6',
  },
  {
    id: 'inheritance',
    name: '相続・事業承継',
    shortName: '相続',
    color: '#ec4899',
  },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];
