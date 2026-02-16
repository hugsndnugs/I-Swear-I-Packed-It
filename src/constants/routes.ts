/**
 * Centralized route path constants.
 * Use these instead of string literals to prevent typos and simplify refactoring.
 */
export const ROUTES = {
  HOME: '/',
  GENERATE: '/generate',
  CHECKLIST: '/checklist',
  MANIFEST: '/manifest',
  EQUIPMENT: '/equipment',
  OP_MODE: '/op-mode',
  PACK: '/pack',
  SETTINGS: '/settings',
} as const

export type RoutePath = typeof ROUTES[keyof typeof ROUTES]
