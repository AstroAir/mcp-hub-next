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

/**
 * Translate common low-level error messages into user-friendly tips.
 */
export function getTroubleshootingTips(message?: string): string[] {
  const msg = (message || '').toLowerCase();
  const tips: string[] = [];

  if (/(network|fetch|timeout|ecconnrefused|etimedout)/.test(msg)) {
    tips.push('Check your internet connection and retry.');
    tips.push('If using a proxy/VPN, ensure it allows GitHub/NPM traffic.');
  }
  if (/(npm|package\.json|node|npx|enoent)/.test(msg)) {
    tips.push('Ensure Node.js and npm are installed and available in PATH.');
    tips.push('Verify the package name/version exists on npm.');
  }
  if (/(github|repo|not found|404|rate limit|403|unauthorized|permission)/.test(msg)) {
    tips.push('Verify the GitHub repository exists and is public or you have access.');
    tips.push('If rate limited, try again later or authenticate to GitHub.');
  }
  if (/(eacces|permission denied|admin)/.test(msg)) {
    tips.push('Try running the app with sufficient permissions.');
  }
  if (tips.length === 0) {
    tips.push('Retry the installation.');
    tips.push('Check logs for details and share with maintainers if the issue persists.');
  }
  return tips;
}
