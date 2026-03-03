import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Only transform JSX files — avoids unnecessary transforms
      include: '**/*.{jsx,tsx}',
    }),
  ],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    // Target modern browsers only — no legacy polyfills needed
    target: ['es2020', 'chrome90', 'firefox88', 'safari14'],

    // Terser gives 15–25% better compression than esbuild for JS
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // Remove all console.* calls in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,               // Two-pass compression for better results
        unsafe_arrows: true,
        unsafe_methods: true,
        toplevel: true,
      },
      mangle: {
        toplevel: true,          // Mangle top-level names
        safari10: false,
      },
      format: {
        comments: false,         // Strip all comments
      },
    },

    // No source maps in production — saves ~40% of bundle
    sourcemap: false,

    // Warn only on truly massive chunks
    chunkSizeWarningLimit: 500,

    // CSS code splitting — each lazy route only loads its CSS
    cssCodeSplit: true,

    rollupOptions: {
      output: {
        // Predictable file naming for long-term caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',

        manualChunks(id) {
          // ── React core (most frequently cached) ──
          if (id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')) {
            return 'react-core';
          }

          // ── Router ──
          if (id.includes('node_modules/react-router') ||
            id.includes('node_modules/@remix-run/')) {
            return 'router';
          }

          // ── Recharts + dependencies (heavy — dashboard-only) ──
          if (id.includes('node_modules/recharts') ||
            id.includes('node_modules/d3-') ||
            id.includes('node_modules/victory-vendor') ||
            id.includes('node_modules/classnames')) {
            return 'charts';
          }

          // ── Lucide icons ──
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }

          // ── Axios and API utilities ──
          if (id.includes('node_modules/axios') ||
            id.includes('node_modules/form-data')) {
            return 'api-client';
          }

          // ── All remaining node_modules → vendor ──
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },

      // Tree-shake dead code from both app code and libraries
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: false,
      },
    },

    // Inline assets < 4KB as base64 (icons, tiny images → zero HTTP requests)
    assetsInlineLimit: 4096,

    // Report actual gzip sizes so you can track regression
    reportCompressedSize: true,
  },

  // Explicitly mark pure side-effect-free modules
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [], // nothing to exclude
  },

  // Ensure JSON files are tree-shaken
  json: {
    stringify: true,
  },
});
