/**
 * PodiumRow — the top-three leaderboard podium.
 *
 * Entries are re-ordered into the classic Olympic visual arrangement — rank 2
 * on the left, rank 1 tall in the centre, rank 3 on the right — regardless of
 * the order they arrive in. Each pedestal stacks a tier Medal, an Avatar, the
 * player's name, and their value. Pedestal height encodes rank so the winner
 * literally stands tallest. The `you` flag paints a coral accent so the
 * signed-in player can spot themselves instantly.
 *
 * Fewer than three entries are handled gracefully: only the pedestals for the
 * ranks actually present are rendered.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radii, spacing, tierColors, typography } from '@/app/theme';
import Avatar from './Avatar';
import Medal from './Medal';

type Rank = 1 | 2 | 3;

interface PodiumEntry {
  rank: Rank;
  name: string;
  value: string;
  you?: boolean;
}

interface PodiumRowProps {
  entries: PodiumEntry[];
}

const RANK_TIER: Record<Rank, keyof typeof tierColors> = {
  1: 'gold',
  2: 'silver',
  3: 'bronze',
};

const PEDESTAL_HEIGHT: Record<Rank, number> = {
  1: 64,
  2: 44,
  3: 32,
};

// Left-to-right display order for the classic podium shape.
const DISPLAY_ORDER: Rank[] = [2, 1, 3];

function Pedestal({ entry }: { entry: PodiumEntry }): React.ReactElement {
  const highlighted = entry.you === true;

  return (
    <View style={styles.column}>
      <Medal tier={RANK_TIER[entry.rank]} size={40} />
      <Avatar name={entry.name} size={48} />
      <Text style={[styles.name, highlighted && styles.nameYou]} numberOfLines={1}>
        {entry.name}
      </Text>
      <Text style={styles.value} numberOfLines={1}>
        {entry.value}
      </Text>
      <View
        style={[
          styles.pedestal,
          { height: PEDESTAL_HEIGHT[entry.rank] },
          highlighted && styles.pedestalYou,
        ]}
      >
        <Text style={[styles.rankText, highlighted && styles.rankTextYou]}>{entry.rank}</Text>
      </View>
    </View>
  );
}

export default function PodiumRow({ entries }: PodiumRowProps): React.ReactElement {
  const byRank = new Map<Rank, PodiumEntry>();
  for (const entry of entries) {
    byRank.set(entry.rank, entry);
  }

  return (
    <View style={styles.row}>
      {DISPLAY_ORDER.map((rank) => {
        const entry = byRank.get(rank);
        if (entry === undefined) {
          return <View key={rank} style={styles.column} />;
        }
        return <Pedestal key={rank} entry={entry} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontFamily: typography.display,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.onCard,
  },
  nameYou: {
    color: palette.coral,
  },
  value: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.onCardMuted,
  },
  pedestal: {
    alignSelf: 'stretch',
    backgroundColor: palette.surfaceAlt,
    borderTopLeftRadius: radii.sm,
    borderTopRightRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  pedestalYou: {
    backgroundColor: palette.coral,
  },
  rankText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: palette.text,
  },
  rankTextYou: {
    color: palette.card,
  },
});
