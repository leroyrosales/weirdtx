import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { buildHeadTags } from './lib/prerenderMeta'

export function renderRouteHtml(pathname: string, origin: string): { appHtml: string; head: ReturnType<typeof buildHeadTags> } {
  const appHtml = renderToString(
    <StrictMode>
      <MemoryRouter initialEntries={[pathname]} initialIndex={0}>
        <App />
      </MemoryRouter>
    </StrictMode>,
  )
  const head = buildHeadTags(pathname, origin)
  return { appHtml, head }
}

export { buildHeadTags } from './lib/prerenderMeta'
