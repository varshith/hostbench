import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROLLUP_DIR, ROOT, SERIES_DIR } from './lib/config.ts';

// Copies the committed rollups into public/ so the site serves /latest.json and /series/<slug>.json.
const pub = resolve(ROOT, 'public');
mkdirSync(resolve(pub, 'series'), { recursive: true });
const latest = resolve(ROLLUP_DIR, 'latest.json');
if (!existsSync(latest)) throw new Error('data/rollups/latest.json missing: run `npm run aggregate` first');
copyFileSync(latest, resolve(pub, 'latest.json'));
for (const f of readdirSync(SERIES_DIR)) if (f.endsWith('.json')) copyFileSync(resolve(SERIES_DIR, f), resolve(pub, 'series', f));
console.log('[publish-data] copied latest.json and series/');
