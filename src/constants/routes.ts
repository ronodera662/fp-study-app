// ルート定義
export const ROUTES = {
  HOME: '/',
  STUDY: '/study',
  STUDY_MODE: '/study/mode',
  QUESTION: '/study/questions',
  RESULT: '/study/result',
  PROGRESS: '/progress',
  QUESTIONS_LIST: '/questions',
  SETTINGS: '/settings',
  AUTH: '/auth',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];
