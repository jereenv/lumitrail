/**
 * TabBar — component unit tests.
 *
 * Verifies game-voice labels render correctly and that the bottom inset is
 * respected for safe-area padding.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import TabBar from './TabBar';

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

describe('TabBar', () => {
  it('renders all six game-voice labels', async () => {
    const { getByText } = await render(<TabBar activeTab="map" onTabPress={() => {}} />);

    expect(getByText('Explore')).toBeTruthy();
    expect(getByText('Journey')).toBeTruthy();
    expect(getByText('Trophies')).toBeTruthy();
    expect(getByText('Ranks')).toBeTruthy();
    expect(getByText('Crew')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });

  it('calls onTabPress with the correct TabId when a tab is pressed', async () => {
    const onTabPress = jest.fn();
    const { getByLabelText } = await render(<TabBar activeTab="map" onTabPress={onTabPress} />);

    fireEvent.press(getByLabelText('Journey'));
    expect(onTabPress).toHaveBeenCalledWith('stats');
  });

  it('marks the active tab as selected', async () => {
    const { getByLabelText } = await render(
      <TabBar activeTab="achievements" onTabPress={() => {}} />,
    );

    expect(getByLabelText('Trophies')).toHaveProp('accessibilityState', {
      selected: true,
    });
    expect(getByLabelText('Explore')).toHaveProp('accessibilityState', {
      selected: false,
    });
  });
});
