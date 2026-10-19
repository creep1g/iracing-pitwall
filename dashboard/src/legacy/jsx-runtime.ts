/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Drop-in replacement for `react/jsx-runtime` (wired up in vite.config.ts).
 *
 * Old WebKit has no flexbox `gap`. When `<html>` carries `no-flex-gap`
 * (set by legacy/shims.ts) inline `style={{ gap }}` on DOM elements is
 * rewritten into CSS custom properties + a `fgap*` class; legacy.css turns
 * those into child margins. Everywhere else this is a pass-through.
 */
import { Fragment, jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'

export { Fragment }

let noGap: boolean | null = null

function px(v: string): string {
  return /^-?\d*\.?\d+$/.test(v) ? v + 'px' : v
}

export function rewrite(type: unknown, props: Record<string, any>): Record<string, any> {
  if (typeof type !== 'string') return props
  const style = props.style
  if (!style || style.gap == null) return props
  if (noGap === null) noGap = document.documentElement.classList.contains('no-flex-gap')
  if (!noGap) return props

  const parts = String(style.gap).trim().split(/\s+/).map(px)
  const row = parts[0]
  const col = parts[1] || parts[0]

  const next: Record<string, string | number> = {}
  for (const k in style) if (k !== 'gap') next[k] = style[k]
  next['--fg-r'] = row
  next['--fg-c'] = col

  const dir =
    style.flexWrap === 'wrap' ? 'fgap-wrap'
    : String(style.flexDirection || '').indexOf('column') === 0 ? 'fgap-col'
    : 'fgap-row'

  return {
    ...props,
    style: next,
    className: (props.className ? props.className + ' ' : '') + 'fgap ' + dir,
  }
}

export function jsx(type: any, props: any, key?: any) {
  return _jsx(type, rewrite(type, props), key)
}

export function jsxs(type: any, props: any, key?: any) {
  return _jsxs(type, rewrite(type, props), key)
}
