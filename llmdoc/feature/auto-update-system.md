# Auto-Update System

## 1. Purpose

The auto-update system provides MCP Hub Next with capability to check for new application versions, automatically download updates, and install them with minimal user intervention. It implements a complete update lifecycle from detection through installation with configurable preferences (auto-download, auto-install on quit, startup checks) and real-time progress tracking.

## 2. How it Works / Architecture

### Update Lifecycle

1. **Startup Check** (Optional)
   - If `check_on_startup` is enabled, waits 3 seconds after app launch then triggers `check_for_updates`
   - Runs asynchronously in background thread
   - Preferences loaded from disk via `load_preferences_from_disk()`

2. **Manual Check**
   - User clicks "Check for Updates" button in Settings > Updates
   - Invokes `check_for_updates` command
   - Emits `checking-for-update` event before checking

3. **Update Detection**
   - Uses `tauri-plugin-updater` v2 to query update server
   - Checks version against `package_info().version`
   - Caches update metadata (version, date, release notes) in `CachedUpdate`

4. **Auto-Download (if enabled)**
   - Downloads update binary with progress tracking
   - Emits `download-progress` events with percent/bytes
   - After download completes, emits `update-downloaded` event

5. **Manual Download (if auto-download disabled)**
   - User clicks "Download" in update notification
   - Invokes `download_update` command
   - Same progress tracking as auto-download

6. **Installation**
   - User clicks "Install Now" button
   - Invokes `quit_and_install` command
   - App quits and tauri-plugin-updater handles installation
   - App relaunches with new version

### State Management

**Backend (Rust - UpdateState)**
- `UpdateState` holds three Mutex-wrapped fields:
  - `preferences`: Current `UpdatePreferences` (auto_download, auto_install_on_app_quit, channel, check_on_startup, last_check_time)
  - `status`: Current `UpdateStatus` (event type and associated data)
  - `cached_update`: `CachedUpdate` from last successful check

**Preferences Persistence**
- Saved to `{app_data}/update_preferences.json` on every `set_update_preferences` call
- Loaded from disk on app startup
- Falls back to `UpdatePreferences::default()` if file doesn't exist

**Frontend (React/TypeScript)**
- `UpdateSettings` component manages full settings UI
- `UpdateNotification` component displays real-time status changes
- Both listen to `update-status` events via `listen()` from `@tauri-apps/api/event`
- Component state synced with Tauri state via command invocations

### Update Events Flow

```
Tauri Backend                          Frontend
─────────────────────────────────────────────────
check_for_updates()
  ├─ emit "checking-for-update"  ──→  UpdateNotification shows spinner
  │
  ├─ check with updater
  │  └─ update found
  │      └─ emit "update-available"  ──→  UpdateNotification shows available
  │         ├─ cache update info
  │         └─ if auto_download
  │            ├─ emit "download-progress"  ──→  Progress bar updates
  │            ├─ download_and_install()
  │            └─ emit "update-downloaded"  ──→  Install buttons shown
  │
  ├─ no update found
  │  └─ emit "update-not-available"  ──→  Toast notification
  │
  └─ error checking
     └─ emit "update-error"  ──→  Error toast + details
```

### Download Progress Tracking

- `download_and_install()` closure receives `chunk_length` and optional `content_length`
- Accumulates `downloaded_bytes` from chunk lengths
- Calculates `percent = (downloaded_bytes / total) * 100`
- Emits `download-progress` event with `{percent, downloaded, total}`
- Second closure invoked when download completes before installation starts

## 3. Relevant Code Modules

- `src-tauri/src/updates.rs` - Core Rust implementation (UpdateState, preferences, commands, update logic)
- `src-tauri/src/lib.rs` - Tauri setup, UpdateState initialization, startup check spawn (lines 32-57)
- `lib/types/tauri.ts` - TypeScript types for UpdatePreferences, UpdateStatus, TauriCommands
- `components/settings/update-settings.tsx` - Settings UI with version display, channel selector, toggles, manual check/download/install buttons
- `components/updates/update-notification.tsx` - Fixed bottom-right notification with state-specific rendering (checking, downloading, installed, available, error)
- `app/[locale]/layout.tsx` - Global layout integration of UpdateNotification component (line 94)
- `src-tauri/Cargo.toml` - Dependencies: `tauri-plugin-updater`, `tokio` with time feature
- `messages/en.json`, `messages/zh-CN.json` - Translations under `settings.updates.*` keys

## 4. Attention

- **Tauri-only**: Auto-update is desktop-only feature. Both components check `window.__TAURI__` and skip initialization in web mode.
- **Update Channel**: Channel selection (stable/beta/alpha) must be configured in `tauri.conf.json` updater plugin configuration.
- **Install Delay**: Auto-install on quit requires user to quit app - installation happens on next launch. Prefer showing "Install Now" notification.
- **Preference Persistence**: Disk save must succeed before state update, otherwise preferences lost. Check file permissions for `{app_data}` directory.
- **Event Listener Cleanup**: Both components must unlisten to `update-status` events in useEffect return to prevent memory leaks from multiple listeners.
