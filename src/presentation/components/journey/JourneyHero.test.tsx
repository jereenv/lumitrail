/**
 * JourneyHero — component unit tests.
 *
 * Verifies that the explorer title, world percentage, and display name are all
 * rendered correctly for a given set of props.
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import JourneyHero from './JourneyHero';

describe('JourneyHero', () => {
  it('renders the correct explorer title for level 5 (Pathfinder)', async () => {
    const { getByText } = await render(
      <JourneyHero displayName="Ada" level={5} worldPercent={0.001} />,
    );
    expect(getByText('Pathfinder')).toBeTruthy();
  });

  it('renders the world percentage formatted to 3 decimal places', async () => {
    const { getByText } = await render(
      <JourneyHero displayName="Ada" level={1} worldPercent={0.001} />,
    );
    expect(getByText('0.001%')).toBeTruthy();
  });

  it('renders the display name', async () => {
    const { getByText } = await render(
      <JourneyHero displayName="Jereen" level={1} worldPercent={0.001} />,
    );
    expect(getByText('Jereen')).toBeTruthy();
  });

  it('renders "Wanderer" for level 1', async () => {
    const { getByText } = await render(
      <JourneyHero displayName="Ada" level={1} worldPercent={0.0} />,
    );
    expect(getByText('Wanderer')).toBeTruthy();
  });

  it('renders "Trailblazer" for level 10', async () => {
    const { getByText } = await render(
      <JourneyHero displayName="Ada" level={10} worldPercent={0.0} />,
    );
    expect(getByText('Trailblazer')).toBeTruthy();
  });

  it('renders "Voyager" for level 20', async () => {
    const { getByText } = await render(
      <JourneyHero displayName="Ada" level={20} worldPercent={0.0} />,
    );
    expect(getByText('Voyager')).toBeTruthy();
  });
});
