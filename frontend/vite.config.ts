import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

// Originals are served by the authenticated API, including legacy certificate links.
const protectedOriginals = {
  name: 'protected-originals',
  configureServer(server: import('vite').ViteDevServer) {
    server.middlewares.use((req, res, next) => {
      let pathname: string;
      try {pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);} catch {res.statusCode = 400; res.end(); return;}
      if (!/^\/certificates(?:\/|$)/i.test(pathname)) {next(); return;}
      const hostname = (req.headers.host || '127.0.0.1').split(':')[0];
      res.statusCode = 307;
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Location', `http://${hostname}:8000/api/portal-storage/catalog/original/?${new URLSearchParams({path: pathname})}`);
      res.end();
    });
  },
  generateBundle() {
    const root = resolve('public');
    const visit = (directory: string) => {
      for (const item of readdirSync(directory, {withFileTypes: true})) {
        const path = resolve(directory, item.name);
        const name = relative(root, path).replace(/\\/g, '/');
        if (/^certificates(?:\/|$)/i.test(name)) continue;
        if (item.isDirectory()) visit(path);
        else this.emitFile({type: 'asset', fileName: name, source: readFileSync(path)});
      }
    };
    visit(root);
  }
} satisfies import('vite').Plugin;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), protectedOriginals],
  optimizeDeps: {
    include: ['bcryptjs', 'docx-preview', 'read-excel-file/browser'],
  },
  build: {
    copyPublicDir: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
});
