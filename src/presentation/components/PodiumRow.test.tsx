/**
 * PodiumRow — component unit tests.
 *
 * Verifies all three entry names render when three entries are supplied.
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import PodiumRow from './PodiumRow';

describe('PodiumRow', () => {
  it('renders all three entry names', async () => {
    const { getByText } = await render(
      <PodiumRow
        entries={[
          { rank: 1, name: 'Ada', value: '1200 km' },
          { rank: 2, name: 'Grace', value: '980 km' },
          { rank: 3, name: 'Linus', value: '760 km', you: true },
        ]}
      />,
    );

    expect(getByText('Ada')).toBeTruthy();
    expect(getByText('Grace')).toBeTruthy();
    expect(getByText('Linus')).toBeTruthy();
  });
});
