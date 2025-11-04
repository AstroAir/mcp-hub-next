/**
 * Tauri Bridge
 * Safe detection and wrapper around Tauri's invoke API so we can call
 * Rust commands only when running inside the desktop app.
 */

let cachedIsTauri: boolean | null = null;

export function isTauri(): boolean {
  if (cachedIsTauri !== null) return cachedIsTauri;
  if (typeof window === 'undefined') {
    cachedIsTauri = false;
    return cachedIsTauri;
  }

  // Tauri v2 injects `window.__TAURI__` and `window.__TAURI_INTERNALS__`
  // Fallback to checking for user agent hint if needed.
  const w = window as unknown as { __TAURI__?: unknown; __TAURI_INTERNALS__?: unknown };
  cachedIsTauri = typeof w.__TAURI__ !== 'undefined' ||
                  typeof w.__TAURI_INTERNALS__ !== 'undefined';
  return cachedIsTauri;
}

/**
 * Dynamically import and call Tauri invoke. Never import on the server.
 */
export async function invoke<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) {
    throw new Error('Tauri invoke called outside desktop runtime');
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}
