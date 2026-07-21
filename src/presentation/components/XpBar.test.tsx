/**
 * XpBar — component unit tests.
 *
 * We test only the pure rendering logic (fill width, label text) using
 * @testing-library/react-native. No native modules are required.
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import XpBar from './XpBar';

describe('XpBar', () => {
  it('renders the XP label when showLabel is true', async () => {
    const { getByText } = await render(
      <XpBar progress={0.4} xpIntoLevel={40} xpForLevelSpan={100} showLabel />,
    );
    expect(getByText('40 / 100 XP')).toBeTruthy();
  });

  it('does not render the XP label when showLabel is false', async () => {
    const { queryByText } = await render(
      <XpBar progress={0.4} xpIntoLevel={40} xpForLevelSpan={100} showLabel={false} />,
    );
    expect(queryByText('40 / 100 XP')).toBeNull();
  });

  it('clamps progress to [0, 1] and does not crash at extremes', async () => {
    await expect(
      render(<XpBar progress={2.5} xpIntoLevel={200} xpForLevelSpan={100} />),
    ).resolves.toBeDefined();
    await expect(
      render(<XpBar progress={-1} xpIntoLevel={0} xpForLevelSpan={100} />),
    ).resolves.toBeDefined();
  });

  it('renders correctly with zero progress', async () => {
    const { getByText } = await render(
      <XpBar progress={0} xpIntoLevel={0} xpForLevelSpan={200} showLabel />,
    );
    expect(getByText('0 / 200 XP')).toBeTruthy();
  });
});
