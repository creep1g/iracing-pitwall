import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import { fileURLToPath } from 'node:url'
import flexGapFallback from './tools/postcss-flex-gap.mjs'

const legacyRuntime = (name: 'jsx-runtime' | 'jsx-dev-runtime') =>
  fileURLToPath(new URL(`./src/legacy/${name}.ts`, import.meta.url))

/**
 * Route `react/jsx-runtime` through src/legacy/jsx-runtime.ts, which emulates
 * flexbox `gap` on browsers without it. The wrapper itself imports the real
 * runtime; the importer check avoids resolving it back to itself.
 */
function flexGapJsxRuntime(): Plugin {
  const wrappers: Record<string, string> = {
    'react/jsx-runtime': legacyRuntime('jsx-runtime'),
    'react/jsx-dev-runtime': legacyRuntime('jsx-dev-runtime'),
  }
  return {
    name: 'flex-gap-jsx-runtime',
    enforce: 'pre',
    resolveId: {
      // Hook filter: only the two jsx-runtime specifiers reach the handler.
      filter: { id: /^react\/jsx(-dev)?-runtime$/ },
      handler(source, importer) {
        const target = wrappers[source]
        if (!target || !importer) return null
        const clean = importer.split('?')[0]
        if (clean === legacyRuntime('jsx-runtime') || clean === legacyRuntime('jsx-dev-runtime')) return null
        return target
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    flexGapJsxRuntime(),
    react(),
    // Legacy bundle for old WebKit (first-gen iPad mini = iOS 9.3.5 / Safari 9).
    // Emits a SystemJS + core-js `nomodule` bundle next to the modern one;
    // modern browsers keep loading only the modern bundle.
    legacy({
      targets: ['safari >= 9', 'ios >= 9', 'defaults'],
      modernPolyfills: false,
    }),
  ],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  css: {
    postcss: { plugins: [flexGapFallback()] },
  },
  build: {
    // Lower CSS syntax and add -webkit- prefixes for Safari 9.
    cssTarget: 'safari9',
  },
})
