/**
 * SectionHeader — component unit tests.
 *
 * Verifies the title renders and that an optional `action` node is displayed.
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import SectionHeader from './SectionHeader';

describe('SectionHeader', () => {
  it('renders the title', async () => {
    const { getByText } = await render(<SectionHeader title="Achievements" />);
    expect(getByText('Achievements')).toBeTruthy();
  });

  it('renders the action node when provided', async () => {
    const { getByText } = await render(
      <SectionHeader title="Achievements" action={<Text>See all</Text>} />,
    );
    expect(getByText('See all')).toBeTruthy();
  });
});
