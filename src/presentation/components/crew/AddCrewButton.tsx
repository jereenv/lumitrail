/**
 * AddCrewButton — a tappable GameCard that prompts the user to invite friends.
 *
 * Renders a single row with a "+" icon (aurora) and "Add Crew Member" label.
 * On press it shows a coming-soon alert — the actual invite flow is deferred
 * until crew codes are implemented on the backend.
 */
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/app/theme';
import GameCard from '@/presentation/components/GameCard';

export default function AddCrewButton(): React.ReactElement {
  const handlePress = (): void => {
    Alert.alert('Add Crew Member', 'Coming soon! Share your crew code to invite friends.');
  };

  return (
    <GameCard testID="add-crew-button" onPress={handlePress} accent={palette.aurora}>
      <View style={styles.row}>
        <Text style={styles.icon}>+</Text>
        <Text style={styles.label}>Add Crew Member</Text>
      </View>
    </GameCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
    color: palette.aurora,
  },
  label: {
    fontFamily: typography.body,
    fontSize: typography.sizes.md,
    color: palette.onCard,
  },
});
