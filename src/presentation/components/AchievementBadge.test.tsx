/**
 * AchievementBadge — component unit tests.
 *
 * Tests locked vs unlocked states, accessible labels, and tier rendering.
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import AchievementBadge from './AchievementBadge';
import type { AchievementDefinition } from '@/domain/achievements/catalog';

const BRONZE_ACHIEVEMENT: AchievementDefinition = {
  id: 'first-light',
  title: 'First Light',
  description: 'Reveal your very first patch of the world.',
  category: 'discovery',
  tier: 'bronze',
  metric: 'cellsRevealed',
  threshold: 1,
};

const GOLD_ACHIEVEMENT: AchievementDefinition = {
  id: 'cartographer',
  title: 'Cartographer',
  description: 'Reveal 1,000 cells.',
  category: 'discovery',
  tier: 'gold',
  metric: 'cellsRevealed',
  threshold: 1000,
};

describe('AchievementBadge', () => {
  it('renders the achievement title', async () => {
    const { getByText } = await render(
      <AchievementBadge achievement={BRONZE_ACHIEVEMENT} unlocked />,
    );
    expect(getByText('First Light')).toBeTruthy();
  });

  it('has accessible label "First Light - unlocked" when unlocked', async () => {
    const { getByLabelText } = await render(
      <AchievementBadge achievement={BRONZE_ACHIEVEMENT} unlocked />,
    );
    expect(getByLabelText('First Light - unlocked')).toBeTruthy();
  });

  it('has accessible label "First Light - locked" when locked', async () => {
    const { getByLabelText } = await render(
      <AchievementBadge achievement={BRONZE_ACHIEVEMENT} unlocked={false} />,
    );
    expect(getByLabelText('First Light - locked')).toBeTruthy();
  });

  it('renders a gold-tier achievement without crashing', async () => {
    await expect(
      render(<AchievementBadge achievement={GOLD_ACHIEVEMENT} unlocked />),
    ).resolves.toBeDefined();
  });
});
