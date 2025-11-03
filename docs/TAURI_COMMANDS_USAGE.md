# Tauri Commands Usage Guide

Complete guide for using Tauri commands in the MCP Hub frontend.

## Table of Contents

1. [Setup](#setup)
2. [Update Commands](#update-commands)
3. [Storage Commands](#storage-commands)
4. [File Dialog Commands](#file-dialog-commands)
5. [Secure Storage Commands](#secure-storage-commands)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## Setup

### Import Tauri API

```typescript
import { invoke } from '@tauri-apps/api/core';
import type { TauriCommands } from '@/lib/types/tauri';
```

### Check if Running in Tauri

Always check if the app is running in Tauri before calling commands:

```typescript
if (typeof window !== 'undefined' && window.__TAURI__) {
  // Safe to use Tauri commands
  await invoke('command_name', { param: value });
} else {
  // Fallback to web APIs
  console.log('Running in web mode');
}
```

---

## Update Commands

### Get App Version

```typescript
const version = await invoke<string>('get_app_version');
console.log('App version:', version);
```

### Get Update Preferences

```typescript
import type { UpdatePreferences } from '@/lib/types/tauri';

const preferences = await invoke<UpdatePreferences>('get_update_preferences');
console.log('Auto download:', preferences.autoDownload);
```

### Set Update Preferences

```typescript
const newPreferences: UpdatePreferences = {
  autoDownload: true,
  autoInstallOnAppQuit: false,
  channel: 'stable',
  checkOnStartup: true,
  lastCheckTime: Date.now()
};

await invoke('set_update_preferences', { preferences: newPreferences });
```

### Check for Updates

```typescript
try {
  await invoke('check_for_updates');
  // Listen for update events
} catch (error) {
  console.error('Failed to check for updates:', error);
}
```

### Install Update

```typescript
await invoke('quit_and_install');
// App will quit and install the update
```

---

## Storage Commands

All storage commands save data to the platform-specific app data directory.

### Get App Data Path

```typescript
const dataPath = await invoke<string>('get_app_data_path');
console.log('App data stored at:', dataPath);
```

### Save/Load Servers

```typescript
// Save servers
const servers = [
  { id: '1', name: 'Server 1', url: 'http://localhost:3000' },
  { id: '2', name: 'Server 2', url: 'http://localhost:3001' }
];

await invoke('save_servers', { servers: JSON.stringify(servers) });

// Load servers
const serversJson = await invoke<string>('load_servers');
const loadedServers = JSON.parse(serversJson);
```

### Save/Load Chat Sessions

```typescript
// Save chat sessions
const sessions = [
  { id: '1', title: 'Chat 1', messages: [...] },
  { id: '2', title: 'Chat 2', messages: [...] }
];

await invoke('save_chat_sessions', { sessions: JSON.stringify(sessions) });

// Load chat sessions
const sessionsJson = await invoke<string>('load_chat_sessions');
const loadedSessions = JSON.parse(sessionsJson);
```

### Save/Load Settings

```typescript
// Save settings
const settings = {
  theme: 'dark',
  language: 'en',
  notifications: true
};

await invoke('save_settings', { settings: JSON.stringify(settings) });

// Load settings
const settingsJson = await invoke<string>('load_settings');
const loadedSettings = JSON.parse(settingsJson);
```

### Backup Management

```typescript
// Create backup
const backupId = `backup_${Date.now()}`;
const backupData = {
  servers: [...],
  sessions: [...],
  settings: {...}
};

await invoke('save_backup', { 
  backupId, 
  data: JSON.stringify(backupData) 
});

// List backups
const backups = await invoke<string[]>('list_backups');
console.log('Available backups:', backups);

// Load backup
const backupJson = await invoke<string>('load_backup', { backupId });
const backup = JSON.parse(backupJson);

// Delete backup
await invoke('delete_backup', { backupId });
```

### Clear All Data

```typescript
// Warning: This deletes all stored data!
await invoke('clear_all_data');
```

---

## File Dialog Commands

### Open File Dialog

```typescript
import type { FileFilter } from '@/lib/types/tauri';

const filters: FileFilter[] = [
  { name: 'JSON Files', extensions: ['json'] },
  { name: 'Text Files', extensions: ['txt', 'md'] }
];

const filePath = await invoke<string | null>('open_file_dialog', {
  title: 'Select a file',
  filters
});

if (filePath) {
  console.log('Selected file:', filePath);
}
```

### Open Multiple Files

```typescript
const filePaths = await invoke<string[]>('open_files_dialog', {
  title: 'Select files',
  filters: [
    { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] }
  ]
});

console.log('Selected files:', filePaths);
```

### Save File Dialog

```typescript
const savePath = await invoke<string | null>('save_file_dialog', {
  title: 'Save file',
  defaultName: 'export.json',
  filters: [
    { name: 'JSON Files', extensions: ['json'] }
  ]
});

if (savePath) {
  console.log('Save to:', savePath);
}
```

### Open Folder Dialog

```typescript
const folderPath = await invoke<string | null>('open_folder_dialog', {
  title: 'Select a folder'
});

if (folderPath) {
  console.log('Selected folder:', folderPath);
}
```

### File I/O Operations

```typescript
// Read text file
const content = await invoke<string>('read_file', { 
  path: '/path/to/file.txt' 
});

// Write text file
await invoke('write_file', { 
  path: '/path/to/file.txt', 
  content: 'Hello, world!' 
});

// Read binary file
const bytes = await invoke<number[]>('read_file_binary', { 
  path: '/path/to/image.png' 
});

// Write binary file
await invoke('write_file_binary', { 
  path: '/path/to/image.png', 
  content: [0x89, 0x50, 0x4E, 0x47, ...] 
});

// Check if file exists
const exists = await invoke<boolean>('file_exists', { 
  path: '/path/to/file.txt' 
});

// Get file metadata
import type { FileMetadata } from '@/lib/types/tauri';

const metadata = await invoke<FileMetadata>('get_file_metadata', { 
  path: '/path/to/file.txt' 
});

console.log('File size:', metadata.size);
console.log('Is file:', metadata.isFile);
console.log('Modified:', metadata.modified);
```

### Message Dialogs

```typescript
// Show message
await invoke('show_message_dialog', {
  title: 'Success',
  message: 'Operation completed successfully',
  kind: 'info' // 'info' | 'warning' | 'error'
});

// Show confirmation
const confirmed = await invoke<boolean>('show_confirm_dialog', {
  title: 'Confirm Delete',
  message: 'Are you sure you want to delete this item?'
});

if (confirmed) {
  // User clicked OK
}
```

---

## Secure Storage Commands

All credentials are stored in the OS keyring (Windows Credential Manager, macOS Keychain, Linux Secret Service).

### Generic Credentials

```typescript
// Save credential
await invoke('save_credential', { 
  key: 'api_key', 
  value: 'sk-1234567890' 
});

// Get credential
const apiKey = await invoke<string | null>('get_credential', { 
  key: 'api_key' 
});

// Check if credential exists
const hasKey = await invoke<boolean>('has_credential', { 
  key: 'api_key' 
});

// Delete credential
await invoke('delete_credential', { 
  key: 'api_key' 
});
```

### OAuth Tokens

```typescript
// Save OAuth token for a server
await invoke('save_oauth_token', {
  serverId: 'github_server',
  token: JSON.stringify({
    access_token: 'gho_...',
    refresh_token: 'ghr_...',
    expires_at: Date.now() + 3600000
  })
});

// Get OAuth token
const tokenJson = await invoke<string | null>('get_oauth_token', {
  serverId: 'github_server'
});

if (tokenJson) {
  const token = JSON.parse(tokenJson);
  console.log('Access token:', token.access_token);
}

// Delete OAuth token
await invoke('delete_oauth_token', {
  serverId: 'github_server'
});
```

### API Keys

```typescript
// Save API key for a service
await invoke('save_api_key', {
  service: 'anthropic',
  apiKey: 'sk-ant-...'
});

// Get API key
const apiKey = await invoke<string | null>('get_api_key', {
  service: 'anthropic'
});

// Delete API key
await invoke('delete_api_key', {
  service: 'anthropic'
});
```

### Encrypted Data

```typescript
// Save encrypted data
await invoke('save_encrypted_data', {
  key: 'user_secrets',
  data: JSON.stringify({ secret1: 'value1', secret2: 'value2' })
});

// Get encrypted data
const dataJson = await invoke<string | null>('get_encrypted_data', {
  key: 'user_secrets'
});

// Delete encrypted data
await invoke('delete_encrypted_data', {
  key: 'user_secrets'
});
```

### Clear All Credentials

```typescript
// Warning: This deletes all credentials from the keyring!
await invoke('clear_all_credentials');
```

---

## Error Handling

All Tauri commands can throw errors. Always use try-catch:

```typescript
try {
  const result = await invoke('some_command', { param: value });
  console.log('Success:', result);
} catch (error) {
  console.error('Command failed:', error);
  // Show error to user
  toast.error(`Failed: ${error}`);
}
```

### Common Error Patterns

```typescript
// File not found
try {
  const content = await invoke<string>('read_file', { path: '/nonexistent.txt' });
} catch (error) {
  if (error.toString().includes('No such file')) {
    console.log('File does not exist');
  }
}

// Permission denied
try {
  await invoke('write_file', { path: '/root/file.txt', content: 'data' });
} catch (error) {
  if (error.toString().includes('Permission denied')) {
    console.log('No permission to write file');
  }
}
```

---

## Best Practices

### 1. Always Check for Tauri Environment

```typescript
const isTauri = typeof window !== 'undefined' && window.__TAURI__;

if (isTauri) {
  // Use Tauri commands
} else {
  // Use web APIs
}
```

### 2. Create Wrapper Functions

```typescript
// lib/services/storage.ts
export async function saveServers(servers: Server[]) {
  if (window.__TAURI__) {
    await invoke('save_servers', { servers: JSON.stringify(servers) });
  } else {
    localStorage.setItem('servers', JSON.stringify(servers));
  }
}

export async function loadServers(): Promise<Server[]> {
  if (window.__TAURI__) {
    const json = await invoke<string>('load_servers');
    return JSON.parse(json);
  } else {
    const json = localStorage.getItem('servers') || '[]';
    return JSON.parse(json);
  }
}
```

### 3. Use TypeScript Types

```typescript
import type { TauriCommands, UpdatePreferences } from '@/lib/types/tauri';

// Type-safe command invocation
const prefs = await invoke<UpdatePreferences>('get_update_preferences');
```

### 4. Handle Errors Gracefully

```typescript
async function saveData(data: any) {
  try {
    await invoke('save_servers', { servers: JSON.stringify(data) });
    toast.success('Data saved successfully');
  } catch (error) {
    console.error('Save failed:', error);
    toast.error('Failed to save data');
    // Optionally fallback to localStorage
    localStorage.setItem('servers', JSON.stringify(data));
  }
}
```

### 5. Use React Hooks

```typescript
// hooks/use-tauri-storage.ts
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useTauriStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.__TAURI__) {
      invoke<string>(`load_${key}`)
        .then(json => setValue(JSON.parse(json)))
        .catch(() => setValue(defaultValue))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [key]);

  const save = async (newValue: T) => {
    setValue(newValue);
    if (window.__TAURI__) {
      await invoke(`save_${key}`, { [key]: JSON.stringify(newValue) });
    }
  };

  return { value, save, loading };
}

// Usage
const { value: servers, save: saveServers, loading } = useTauriStorage('servers', []);
```

---

## Complete Example

```typescript
'use client';

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { FileFilter } from '@/lib/types/tauri';
import { toast } from 'sonner';

export function ExportImportExample() {
  const [data, setData] = useState<any>(null);

  // Export data
  const handleExport = async () => {
    if (!window.__TAURI__) {
      toast.error('Export only available in desktop mode');
      return;
    }

    try {
      // Show save dialog
      const savePath = await invoke<string | null>('save_file_dialog', {
        title: 'Export Data',
        defaultName: 'export.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });

      if (!savePath) return;

      // Write file
      await invoke('write_file', {
        path: savePath,
        content: JSON.stringify(data, null, 2)
      });

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    }
  };

  // Import data
  const handleImport = async () => {
    if (!window.__TAURI__) {
      toast.error('Import only available in desktop mode');
      return;
    }

    try {
      // Show open dialog
      const filePath = await invoke<string | null>('open_file_dialog', {
        title: 'Import Data',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });

      if (!filePath) return;

      // Read file
      const content = await invoke<string>('read_file', { path: filePath });
      const importedData = JSON.parse(content);

      setData(importedData);
      toast.success('Data imported successfully');
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import data');
    }
  };

  return (
    <div>
      <button onClick={handleExport}>Export</button>
      <button onClick={handleImport}>Import</button>
    </div>
  );
}
```

