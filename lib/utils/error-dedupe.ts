/**
 * Error deduplication utility
 * Prevents spamming the same error repeatedly within a cooldown window.
 */

const lastShown = new Map<string, number>();

/**
 * Returns true if a notification for this key should be shown now.
 * If shown, the timestamp is recorded to enforce cooldown next time.
 */
export function shouldNotify(key: string, cooldownMs = 5000): boolean {
  const now = Date.now();
  const last = lastShown.get(key) ?? 0;
  if (now - last < cooldownMs) return false;
  lastShown.set(key, now);
  return true;
}

/** Clears the last-shown timestamp for a key (e.g., after user dismisses). */
export function clearNotify(key: string) {
  lastShown.delete(key);
}

/** Build a stable dedupe key based on context */
export function buildErrorKey(prefix: string, id?: string, message?: string) {
  const msg = (message || '').slice(0, 200); // cap to avoid huge keys
  return [prefix, id, msg].filter(Boolean).join(":");
}

export type TroubleshootingTipKey =
  | 'networkCheckConnection'
  | 'networkProxy'
  | 'npmEnsureNode'
  | 'npmVerifyPackage'
  | 'githubVerifyRepo'
  | 'githubRateLimit'
  | 'permissionsElevate'
  | 'generalRetry'
  | 'generalCheckLogs';

/**
 * Translate common low-level error messages into user-friendly tip keys.
 */
export function getTroubleshootingTips(message?: string): TroubleshootingTipKey[] {
  const msg = (message || '').toLowerCase();
  const tips: TroubleshootingTipKey[] = [];

  if (/(network|fetch|timeout|ecconnrefused|etimedout)/.test(msg)) {
    tips.push('networkCheckConnection');
    tips.push('networkProxy');
  }
  if (/(npm|package\.json|node|npx|enoent)/.test(msg)) {
    tips.push('npmEnsureNode');
    tips.push('npmVerifyPackage');
  }
  if (/(github|repo|not found|404|rate limit|403|unauthorized|permission)/.test(msg)) {
    tips.push('githubVerifyRepo');
    tips.push('githubRateLimit');
  }
  if (/(eacces|permission denied|admin)/.test(msg)) {
    tips.push('permissionsElevate');
  }
  if (tips.length === 0) {
    tips.push('generalRetry');
    tips.push('generalCheckLogs');
  }
  return tips;
}
