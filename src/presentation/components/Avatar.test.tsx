/**
 * Avatar — component unit tests.
 *
 * Verifies the initial is derived from the name and that a level badge renders
 * when a `level` is supplied.
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import Avatar from './Avatar';

describe('Avatar', () => {
  it('renders the uppercased first initial of the name', async () => {
    const { getByText } = await render(<Avatar name="jereen" />);
    expect(getByText('J')).toBeTruthy();
  });

  it('renders the level badge text when a level is provided', async () => {
    const { getByText } = await render(<Avatar name="Ada" level={7} />);
    expect(getByText('7')).toBeTruthy();
  });
});
