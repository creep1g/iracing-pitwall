import './legacy/shims' // must run before anything touches ResizeObserver / Path2D / AudioContext
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './index.css'
import App from './App.tsx'
import './legacy/legacy.css' // keep last: fallbacks override at equal specificity

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
