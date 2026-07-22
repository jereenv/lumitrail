/**
 * Medal — component unit tests.
 *
 * Tests behaviour and accessibility, not colours: an unlocked medal renders
 * for a given tier, and a locked medal still renders (asserted via its
 * accessibility label rather than any colour value).
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import Medal from './Medal';

describe('Medal', () => {
  it('renders for a given tier', async () => {
    const { getByLabelText } = await render(<Medal tier="gold" />);
    expect(getByLabelText('gold medal - unlocked')).toBeTruthy();
  });

  it('renders the locked variant', async () => {
    const { getByLabelText } = await render(<Medal tier="silver" locked progress={0.5} />);
    expect(getByLabelText('silver medal - locked')).toBeTruthy();
  });
});
