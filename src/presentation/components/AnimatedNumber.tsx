/**
 * AnimatedNumber — a text number that counts up/down when its value changes.
 *
 * It keeps an `Animated.Value` and, whenever the target `value` prop changes,
 * runs an `Animated.timing` from the previous value to the new one. Because we
 * need to read the intermediate numeric value on every frame (to format it as
 * text) we must use the JS-driven animation — `useNativeDriver: false` — since
 * the native driver cannot call back into JS mid-animation.
 *
 * We subscribe to the value with `addListener` and mirror each frame into React
 * state so the displayed text re-renders. The `format` callback turns the raw
 * number into a string (defaulting to a rounded integer), letting callers add
 * units or separators (e.g. "1,200 km").
 */
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, type TextStyle } from 'react-native';

import { motion, palette, typography } from '@/app/theme';

interface AnimatedNumberProps {
  value: number;
  /** Formats the current numeric value into display text. */
  format?: (n: number) => string;
  /** Animation duration in ms. Defaults to `motion.durations.medium`. */
  duration?: number;
  /** When true, animates from 0 to value on mount. Defaults to false. */
  countUpOnMount?: boolean;
  style?: TextStyle;
}

const defaultFormat = (n: number): string => String(Math.round(n));

export default function AnimatedNumber({
  value,
  format = defaultFormat,
  duration = motion.durations.medium,
  countUpOnMount = false,
  style,
}: AnimatedNumberProps): React.ReactElement {
  // Lazy useState keeps a single Animated.Value across renders without reading
  // a ref's `.current` during render (which the react-hooks/refs rule forbids).
  // When countUpOnMount is true, seed to 0; otherwise seed to the target value.
  const [animated] = useState(() => new Animated.Value(countUpOnMount ? 0 : value));
  const [display, setDisplay] = useState<number>(countUpOnMount ? 0 : value);

  useEffect(() => {
    const id = animated.addListener(({ value: current }) => {
      setDisplay(current);
    });

    const animation = Animated.timing(animated, {
      toValue: value,
      duration,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      // Snap to the exact target so the settled text is never off by a
      // sub-pixel frame value left over from the timing curve.
      if (finished) {
        setDisplay(value);
      }
    });

    return () => {
      animation.stop();
      animated.removeListener(id);
    };
  }, [animated, value, duration]);

  return <Text style={[styles.text, style]}>{format(display)}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: palette.onCard,
  },
});
