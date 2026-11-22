import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({
  root,
  configFile: false,
  server: { middlewareMode: true, watch: null, ws: false }
});

try {
  const module = await vite.ssrLoadModule('/scripts/portalCatalog.ts');
  process.stdout.write(JSON.stringify(module.portalCatalog));
} finally {
  await vite.close();
}
