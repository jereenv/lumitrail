/**
 * HudCard — a page-local wrapper that renders the map HUD as a cream
 * GameCard sticker.
 *
 * Keeping HUD layout logic here (rather than inline in MapScreen) means
 * MapScreen only describes *what* goes in the HUD, not *how* it looks.
 * GameCard provides the cream surface, rounded border, and drop shadow.
 */
import React from 'react';
import type { ViewStyle } from 'react-native';

import { GameCard } from '@/presentation/components';
import { spacing } from '@/app/theme';

interface HudCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const hudCardStyle: ViewStyle = {
  margin: spacing.md,
  gap: spacing.sm,
};

export default function HudCard({ children, style }: HudCardProps): React.ReactElement {
  const merged: ViewStyle = style !== undefined ? { ...hudCardStyle, ...style } : hudCardStyle;
  return <GameCard style={merged}>{children}</GameCard>;
}
