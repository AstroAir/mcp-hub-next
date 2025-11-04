/* eslint-disable */
'use strict';
// Cross-platform Tauri build helper to ensure Next.js static export is enabled
// Sets TAURI_STATIC_EXPORT and invokes `pnpm build` with inherited stdio

const { spawnSync } = require('node:child_process');

process.env.TAURI_STATIC_EXPORT = 'true';

const result = spawnSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['build'], {
  stdio: 'inherit',
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
