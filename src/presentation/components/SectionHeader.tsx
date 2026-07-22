/**
 * SectionHeader — a titled row that introduces a section of a screen.
 *
 * The title uses the display typeface in the primary on-card ink colour. An
 * optional `action` node (e.g. a "See all" link or icon button) is rendered
 * right-aligned on the same baseline row, with `space-between` pushing it to
 * the far edge.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/app/theme';

interface SectionHeaderProps {
  title: string;
  /** Optional node rendered right-aligned on the same row. */
  action?: React.ReactNode;
}

export default function SectionHeader({ title, action }: SectionHeaderProps): React.ReactElement {
  return (
    <View style={styles.row}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {action !== undefined && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  title: {
    flexShrink: 1,
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: palette.onCard,
  },
  action: {
    flexShrink: 0,
  },
});
