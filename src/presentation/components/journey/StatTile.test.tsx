/**
 * StatTile — component unit tests.
 *
 * Uses fake timers to drive the JS-driven Animated timing to completion so
 * AnimatedNumber settles on its final value before we assert.
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React, { act } from 'react';
import { render } from '@testing-library/react-native';

import StatTile from './StatTile';

const ACCENT = '#38E0A6'; // palette.aurora — any string is fine for tests

describe('StatTile', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('displays the integer value after count-up animation completes', async () => {
    const { getByText } = await render(
      <StatTile label="Cells revealed" value={42} icon="⬡" accent={ACCENT} />,
    );

    await act(async () => {
      jest.runAllTimers();
    });

    expect(getByText('42')).toBeTruthy();
  });

  it('applies a custom format function to the settled value', async () => {
    const { getByText } = await render(
      <StatTile
        label="Distance"
        value={12.3}
        format={(n) => `${n.toFixed(1)} km`}
        icon="📍"
        accent={ACCENT}
      />,
    );

    await act(async () => {
      jest.runAllTimers();
    });

    expect(getByText('12.3 km')).toBeTruthy();
  });

  it('renders the label and icon text', async () => {
    const { getByText } = await render(
      <StatTile label="Countries" value={5} icon="🌍" accent={ACCENT} />,
    );

    await act(async () => {
      jest.runAllTimers();
    });

    expect(getByText('🌍')).toBeTruthy();
    expect(getByText('Countries')).toBeTruthy();
  });
});
