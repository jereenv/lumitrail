/**
 * GameCard — component unit tests.
 *
 * Tests behaviour, not styling: that children render, and that pressing a
 * card with an `onPress` handler invokes it.
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import GameCard from './GameCard';

describe('GameCard', () => {
  it('renders its children', async () => {
    const { getByText } = await render(
      <GameCard>
        <Text>Card body</Text>
      </GameCard>,
    );
    expect(getByText('Card body')).toBeTruthy();
  });

  it('calls onPress when the card is pressed', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <GameCard onPress={onPress} testID="game-card">
        <Text>Tap me</Text>
      </GameCard>,
    );

    fireEvent.press(getByTestId('game-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
