/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, jsxDEV as _jsxDEV } from 'react/jsx-dev-runtime'
import { rewrite } from './jsx-runtime'

export { Fragment }

// Dev builds go through the same rewrite so `npm run dev` behaves like prod.
export function jsxDEV(type: any, props: any, key: any, isStatic: boolean, source?: any, self?: any) {
  return _jsxDEV(type, rewrite(type, props), key, isStatic, source, self)
}
