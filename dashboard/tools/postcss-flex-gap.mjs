/**
 * PostCSS plugin: margin-based fallback for flexbox `gap` (Safari < 14.1).
 *
 * For every rule that declares gap/row-gap/column-gap (and is not a grid
 * container) it appends a sibling rule scoped to `.no-flex-gap` — a class
 * that src/legacy/shims.ts sets on <html> only when flex gap is unsupported.
 * Modern browsers never match it, so their layout is untouched.
 *
 *   .row { display:flex; gap:8px }
 *   → .no-flex-gap .row > * + * { margin-left:8px }
 *
 * column direction → margin-top; flex-wrap:wrap → right/bottom margins on
 * every child (trailing space is accepted).
 */
const px = (v) => (/^-?\d*\.?\d+$/.test(v) && v !== '0' ? v + 'px' : v)

/** @type {import('postcss').PluginCreator} */
const plugin = () => ({
  postcssPlugin: 'flex-gap-fallback',
  Rule(rule, { Rule, Declaration }) {
    if (rule.__flexGapDone) return
    if (rule.parent && rule.parent.type === 'atrule' && /keyframes/i.test(rule.parent.name)) return

    let gap, rowGap, colGap, display, dir, wrap
    rule.each((d) => {
      if (d.type !== 'decl') return
      switch (d.prop) {
        case 'gap': gap = d.value; break
        case 'row-gap': rowGap = d.value; break
        case 'column-gap': colGap = d.value; break
        case 'display': display = d.value; break
        case 'flex-direction': dir = d.value; break
        case 'flex-wrap': wrap = d.value; break
      }
    })
    if (gap === undefined && rowGap === undefined && colGap === undefined) return
    if (display && /grid/.test(display)) return // grid has its own fallback in legacy.css

    const parts = (gap || '').trim().split(/\s+/).filter(Boolean)
    const r = px(rowGap || parts[0] || '0')
    const c = px(colGap || parts[1] || parts[0] || '0')

    const selectors = rule.selectors.filter((s) => s.indexOf('::') === -1)
    if (!selectors.length) return

    const isWrap = wrap && /^wrap/.test(wrap)
    const isCol = dir && /^column/.test(dir)
    const sel = (suffix) => selectors.map((s) => `.no-flex-gap ${s}${suffix}`).join(', ')

    const out = new Rule({ selector: isWrap ? sel(' > *') : sel(' > * + *') })
    out.__flexGapDone = true
    if (isWrap) {
      out.append(new Declaration({ prop: 'margin', value: `0 ${c} ${r} 0` }))
    } else if (isCol) {
      out.append(new Declaration({ prop: 'margin-top', value: r }))
    } else {
      out.append(new Declaration({ prop: 'margin-left', value: c }))
    }
    rule.after(out)
  },
})
plugin.postcss = true

export default plugin
