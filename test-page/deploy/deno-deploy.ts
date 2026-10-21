// Deno Deploy: deployctl deploy --project=hostbench-probe --prod test-page/deploy/deno-deploy.ts (run from repo root)
import { serveDir } from 'jsr:@std/http@1/file-server';
Deno.serve((req) => serveDir(req, { fsRoot: 'test-page', quiet: true }));
