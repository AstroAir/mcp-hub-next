import { eventToToken, bindingTokens, matchToken, isSequence, formatBinding } from './shortcuts';

describe('shortcuts utils', () => {
  it('eventToToken normalizes keys and modifiers', () => {
    const e = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, shiftKey: true });
    expect(eventToToken(e)).toBe('Ctrl+Shift+K');

    const e2 = new KeyboardEvent('keydown', { key: 'Escape' });
    expect(eventToToken(e2)).toBe('Esc');
  });

  it('bindingTokens splits alternatives', () => {
    expect(bindingTokens('Meta+K|Ctrl+K')).toEqual(['Meta+K', 'Ctrl+K']);
  });

  it('matchToken checks if token is in binding set', () => {
    expect(matchToken('Meta+K|Ctrl+K', 'Ctrl+K')).toBe(true);
    expect(matchToken('Meta+K|Ctrl+K', 'Alt+K')).toBe(false);
  });

  it('isSequence detects space separated sequences', () => {
    expect(isSequence('G D')).toBe(true);
    expect(isSequence('Ctrl+K')).toBe(false);
  });

  it('formatBinding creates user-facing text', () => {
    expect(formatBinding('Meta+K|Ctrl+K')).toBe('Meta+K or Ctrl+K');
  });
});
