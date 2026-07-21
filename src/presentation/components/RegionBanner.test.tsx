import React from 'react';
import { render } from '@testing-library/react-native';

import { RegionBanner } from './RegionBanner';

describe('RegionBanner', () => {
  it('shows the locality and percent uncovered', async () => {
    const { getByTestId } = await render(<RegionBanner locality="Richmond" percent={0.27} />);
    expect(getByTestId('region-banner-name').props.children).toBe('Richmond');
    expect(getByTestId('region-banner-percent').props.children).toBe('0.3%');
  });
});
