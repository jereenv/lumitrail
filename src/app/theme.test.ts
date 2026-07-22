import { palette, cardShadow, motion } from './theme';

test('game palette tokens exist and are strings', () => {
  for (const key of [
    'fog',
    'canvas',
    'card',
    'cardBorder',
    'onCard',
    'onCardMuted',
    'coral',
    'berry',
    'frontier',
    'frontierCasing',
    'shadow',
  ] as const) {
    expect(typeof palette[key]).toBe('string');
    expect(palette[key].length).toBeGreaterThan(0);
  }
});

test('cardShadow and motion helpers are shaped correctly', () => {
  expect(cardShadow.shadowColor).toBe(palette.shadow);
  expect(typeof cardShadow.elevation).toBe('number');
  expect(motion.spring.damping).toBeGreaterThan(0);
  expect(motion.durations.short).toBeGreaterThan(0);
});
