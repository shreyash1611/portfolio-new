import { useEffect, useState } from 'react'

// Vite only exposes env vars prefixed with VITE_ to client-side code (see
// frontend/.env). Everything else (like a real secret) stays server-only.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

// One entry per backend endpoint we want to look at. Keeping this as data
// (rather than 4 near-identical copy-pasted fetch calls) means adding a
// new endpoint later is a one-line change here.
const ENDPOINTS = [
  { label: 'health', path: '/api/health' },
  { label: 'problems', path: '/api/stats/problems' },
  { label: 'ratings', path: '/api/stats/ratings' },
  { label: 'heatmap', path: '/api/stats/heatmap' },
  { label: 'combined', path: '/api/stats/combined' },
] as const

type EndpointLabel = (typeof ENDPOINTS)[number]['label']

// Each endpoint is either still loading, loaded with some JSON value, or
// failed with an error message -- a "result" state instead of separate
// loading/data/error booleans avoids impossible combinations (e.g. loading
// AND error both true at once).
type FetchState =
  | { status: 'loading' }
  | { status: 'success'; data: unknown }
  | { status: 'error'; message: string }

function App() {
  const [results, setResults] = useState<Record<EndpointLabel, FetchState>>(
    () =>
      Object.fromEntries(ENDPOINTS.map((e) => [e.label, { status: 'loading' }])) as Record<
        EndpointLabel,
        FetchState
      >,
  )

  useEffect(() => {
    // AbortController lets us cancel in-flight requests if the component
    // unmounts before they finish (e.g. during React's StrictMode double-
    // render in dev) -- otherwise we'd risk calling setState after unmount.
    const controller = new AbortController()

    for (const endpoint of ENDPOINTS) {
      fetch(`${API_BASE_URL}${endpoint.path}`, { signal: controller.signal })
        .then(async (res) => {
          const body = await res.json()
          if (!res.ok) {
            throw new Error(body.error ?? `HTTP ${res.status}`)
          }
          return body.data
        })
        .then((data) => {
          setResults((prev) => ({ ...prev, [endpoint.label]: { status: 'success', data } }))
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return
          const message = err instanceof Error ? err.message : String(err)
          setResults((prev) => ({ ...prev, [endpoint.label]: { status: 'error', message } }))
        })
    }

    return () => controller.abort()
  }, [])

  return (
    <>
      <h1>Portfolio stats -- raw API data</h1>
      <p>Fetching straight from {API_BASE_URL}, no processing, no charts yet.</p>

      {ENDPOINTS.map((endpoint) => {
        const result = results[endpoint.label]
        return (
          <section key={endpoint.label}>
            <h2>
              {endpoint.label} <small>{endpoint.path}</small>
            </h2>
            {result.status === 'loading' && <p>loading...</p>}
            {result.status === 'error' && <p style={{ color: 'crimson' }}>error: {result.message}</p>}
            {result.status === 'success' && <pre>{JSON.stringify(result.data, null, 2)}</pre>}
          </section>
        )
      })}
    </>
  )
}

export default App
