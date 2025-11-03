/**
 * Global Window Type Extensions
 * Extends the Window interface with Tauri-specific properties
 */

interface Window {
  /**
   * Tauri API object injected by the Tauri runtime
   * This is available when the app is running in Tauri desktop mode
   */
  __TAURI__?: {
    convertFileSrc: (filePath: string, protocol?: string) => string;
  };
}

