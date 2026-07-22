/**
 * ScreenHeader — a top section shared by every screen.
 *
 * Renders a title in the display typeface, an optional muted subtitle, and an
 * optional right-aligned slot for actions (e.g. an icon button or a badge).
 * Keeping this in one component ensures all screens feel cohesive and means we
 * only update padding/colour in one place when the design changes.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/app/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  subtitle,
  rightElement,
}: ScreenHeaderProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle !== undefined && subtitle !== '' && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement !== undefined && <View style={styles.right}>{rightElement}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.canvas,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  title: {
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
    color: palette.onCard,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
  },
  right: {
    flexShrink: 0,
  },
});
