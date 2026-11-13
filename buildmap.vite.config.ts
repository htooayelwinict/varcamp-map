import { defineConfig } from 'vite';
import { worldRelease } from './tools/release';

export default defineConfig({
  base: './',
  publicDir: false,
  build: {
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      output: { entryFileNames: 'assets/[name]-[hash].js' },
      input: { expedition: './src/adventure/index.html', journal: './src/journal/index.html', 'check-in': './src/check-in/index.html', 'src-main': './src/main.ts' },
    },
  },
  preview: { cors: true },
  plugins: [worldRelease()],
});
