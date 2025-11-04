import { cn } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('dedupes conflicting tailwind classes', () => {
    // tailwind-merge should remove the first conflicting class
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('handles falsy values', () => {
    expect(cn('a', undefined, null, false, 0 && 'x', 'b')).toBe('a b');
  });
});
