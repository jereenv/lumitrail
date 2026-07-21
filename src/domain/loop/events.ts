/**
 * Domain events emitted by the game loop.
 *
 * The loop is pure, so instead of firing callbacks it returns a list of events
 * describing what happened. The presentation layer turns these into toasts,
 * haptics, confetti, and sounds. This decoupling means the core is testable
 * without any UI, and the UI can react to exactly the moments that matter.
 */
import type { H3Index } from '@/domain/geo/types';
import type { XpBreakdown } from '@/domain/progression/xp';

export type FixRejectionReason = 'inaccurate' | 'no-timestamp';

export type DomainEvent =
  | { readonly type: 'cellsRevealed'; readonly cells: readonly H3Index[] }
  | { readonly type: 'xpGained'; readonly breakdown: XpBreakdown }
  | { readonly type: 'leveledUp'; readonly from: number; readonly to: number }
  | { readonly type: 'achievementUnlocked'; readonly achievementId: string }
  | { readonly type: 'regionCompleted'; readonly regionId: string; readonly regionName: string }
  | { readonly type: 'streakExtended'; readonly days: number }
  | { readonly type: 'fixRejected'; readonly reason: FixRejectionReason };
