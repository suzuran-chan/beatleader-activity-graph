import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx, defineManifest } from '@crxjs/vite-plugin';
import packageJson from './package.json';

const manifest = defineManifest({
  manifest_version: 3,
  name: 'BeatLeader Activity Graph',
  version: packageJson.version,
  description: 'Displays contribution graph on BeatLeader profile.',
  permissions: [],
  // ▼▼▼ 修正箇所: .com も許可する ▼▼▼
  host_permissions: [
    '*://*.beatleader.xyz/*',
    '*://*.beatleader.com/*', 
    'https://api.beatleader.xyz/*',
    'https://api.beatleader.com/*'
  ],
  content_scripts: [
    {
      // ▼▼▼ 修正箇所: .com でもスクリプトを走らせる ▼▼▼
      matches: [
        '*://*.beatleader.xyz/u/*',
        '*://*.beatleader.com/u/*'
      ],
      js: ['src/content.tsx'],
    },
  ],
});

export default defineConfig({
  plugins: [react(), crx({ manifest })],
});