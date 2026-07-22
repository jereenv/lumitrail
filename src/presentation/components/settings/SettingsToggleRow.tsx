/**
 * SettingsToggleRow — a single row in the sharing section containing a toggle.
 *
 * Renders a label and optional description on the left, with a Switch on the right.
 * When showDivider is true, adds a 1px divider below the row for visual separation.
 */
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/app/theme';

interface SettingsToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  accessibilityLabel: string;
  testID?: string;
  showDivider?: boolean;
}

export default function SettingsToggleRow({
  label,
  description,
  value,
  onValueChange,
  accessibilityLabel,
  testID,
  showDivider,
}: SettingsToggleRowProps): React.ReactElement {
  return (
    <>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          {description !== undefined && description !== '' && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>
        <View style={styles.switchContainer}>
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: palette.cardBorder, true: palette.aurora }}
            thumbColor={palette.card}
            accessibilityLabel={accessibilityLabel}
            testID={testID}
          />
        </View>
      </View>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: typography.body,
    fontSize: typography.sizes.md,
    color: palette.onCard,
    fontWeight: '500',
  },
  description: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.onCardMuted,
  },
  switchContainer: {
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: palette.cardBorder,
    marginVertical: spacing.xs,
  },
});
