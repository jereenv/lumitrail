/**
 * AnimatedNumber — component unit tests.
 *
 * Uses fake timers to drive the JS-driven Animated timing to completion, then
 * asserts the final formatted value is displayed.
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React, { act } from 'react';
import { render } from '@testing-library/react-native';

import AnimatedNumber from './AnimatedNumber';

describe('AnimatedNumber', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('eventually displays the target value with the default formatter', async () => {
    const { getByText } = await render(<AnimatedNumber value={42} />);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(getByText('42')).toBeTruthy();
  });

  it('applies a custom formatter to the settled value', async () => {
    const { getByText } = await render(
      <AnimatedNumber value={1200} format={(n) => `${Math.round(n)} km`} />,
    );

    await act(async () => {
      jest.runAllTimers();
    });

    expect(getByText('1200 km')).toBeTruthy();
  });

  it('counts up from 0 on mount when countUpOnMount is true', async () => {
    const { getByText } = await render(<AnimatedNumber value={100} countUpOnMount />);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(getByText('100')).toBeTruthy();
  });
});
