/**
 * Shortcuts utilities: normalization, matching and formatting
 */

import type { ShortcutBinding } from '@/lib/types';

// Normalize a key event to a token like 'Ctrl+K', 'Meta+/' or 'Shift+?'
export function eventToToken(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.metaKey) parts.push('Meta');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  let key = e.key;
  // Normalize some keys
  if (key === ' ') key = 'Space';
  if (key === '?') key = '?';
  if (key === 'Escape') key = 'Esc';
  if (key.length === 1) {
    // Uppercase letters/symbols
    key = key.toUpperCase();
  }
  parts.push(key);
  return parts.join('+');
}

export function bindingTokens(binding: ShortcutBinding): string[] {
  return binding
    .split('|')
    .map((t) => t.trim())
    .filter(Boolean);
}

export function matchToken(binding: ShortcutBinding, token: string): boolean {
  const tokens = bindingTokens(binding);
  return tokens.includes(token);
}

export function isSequence(binding: ShortcutBinding): boolean {
  // crude check for space between keys like 'G D'
  return binding.includes(' ');
}

export function formatBinding(binding: ShortcutBinding): string {
  return binding
    .split('|')
    .map((t) => t.trim())
    .filter(Boolean)
    .join(' or ');
}
