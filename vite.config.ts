import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async () => {
  const plugins = [react(), tailwindcss()];
  try {
    // @ts-ignore
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {}
  return {
    plugins,
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              const cleanId = id.split('?')[0];
              if (cleanId.endsWith('.css') || cleanId.endsWith('.scss') || cleanId.endsWith('.sass') || cleanId.endsWith('.less')) {
                return;
              }
              if (id.includes('framer-motion')) {
                return 'vendor-framer';
              }
              if (id.includes('highlight.js')) {
                return 'vendor-highlight';
              }
              if (id.includes('/react/') || id.includes('/react-dom/')) {
                return 'vendor-react';
              }
              return 'vendor';
            }
          }
        }
      }
    }
  };
})
