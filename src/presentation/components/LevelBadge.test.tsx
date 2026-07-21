/**
 * LevelBadge — component unit tests.
 *
 * Verifies that the level number is rendered correctly across different sizes.
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import LevelBadge from './LevelBadge';

describe('LevelBadge', () => {
  it('renders the level number', async () => {
    const { getByText } = await render(<LevelBadge level={7} />);
    expect(getByText('7')).toBeTruthy();
  });

  it('renders level 1 without crashing', async () => {
    const { getByText } = await render(<LevelBadge level={1} />);
    expect(getByText('1')).toBeTruthy();
  });

  it('renders the "Lv" prefix label', async () => {
    const { getByText } = await render(<LevelBadge level={42} />);
    expect(getByText('Lv')).toBeTruthy();
  });

  it('renders all size variants without crashing', async () => {
    await expect(render(<LevelBadge level={5} size="sm" />)).resolves.toBeDefined();
    await expect(render(<LevelBadge level={5} size="md" />)).resolves.toBeDefined();
    await expect(render(<LevelBadge level={5} size="lg" />)).resolves.toBeDefined();
  });
});
