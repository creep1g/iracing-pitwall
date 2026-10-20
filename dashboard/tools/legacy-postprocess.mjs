/**
 * Vite plugin: second Babel pass over the finished *legacy* chunks.
 *
 * @vitejs/plugin-legacy runs Babel on source modules, but the bundler adds its
 * own runtime helpers (and the core-js polyfill chunk) afterwards. Those use
 * arrow functions, which Safari 9 cannot parse (added in Safari 10), so the
 * whole legacy bundle died with a SyntaxError. This pass lowers whatever is
 * left to what Safari 9 understands. It only touches files with "legacy" in
 * their name; the modern bundle is never modified.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { transformSync } from '@babel/core'

/** @returns {import('vite').Plugin} */
export default function legacyPostprocess() {
  let outDir = 'dist'
  let root = process.cwd()
  return {
    name: 'legacy-es5-postprocess',
    apply: 'build',
    enforce: 'post',
    configResolved(cfg) {
      outDir = cfg.build.outDir
      root = cfg.root
    },
    closeBundle: {
      order: 'post',
      handler() {
        const dir = join(root, outDir, 'assets')
        let n = 0
        for (const f of readdirSync(dir)) {
          if (!/legacy.*\.js$/.test(f)) continue
          const p = join(dir, f)
          const out = transformSync(readFileSync(p, 'utf8'), {
            babelrc: false,
            configFile: false,
            sourceType: 'script',
            compact: true,
            comments: false,
            presets: [[
              '@babel/preset-env',
              {
                targets: { safari: '9', ios: '9' },
                // never insert polyfills here; core-js is already bundled
                useBuiltIns: false,
                modules: false,
                // arrow functions are the known offender; keep explicit even
                // if browserslist data says Safari 9 supports them
                include: [
                  'transform-arrow-functions',
                  'transform-template-literals',
                  'transform-shorthand-properties',
                  'transform-block-scoping',
                  'transform-parameters',
                  'transform-destructuring',
                  'transform-spread',
                ],
              },
            ]],
          })
          if (!out || !out.code) throw new Error(`legacy-postprocess: Babel produced no output for ${f}`)
          writeFileSync(p, out.code)
          n++
        }
        // eslint-disable-next-line no-console
        console.log(`legacy-postprocess: lowered ${n} legacy chunk(s)`)
      },
    },
  }
}
