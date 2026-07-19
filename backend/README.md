# Portfolio stats backend

A Go service that aggregates one person's (your) GitHub, LeetCode and
Codeforces profile data into a small JSON API: problems solved, contest
rating history, and a combined activity heatmap. Built as a learn-Go-by-
doing project -- everything is standard library only (`net/http`, no
framework), with generics and goroutines used where they genuinely help.

## Running it

1. Copy `.env.example` to `.env` and fill in your usernames/handle and a
   GitHub token (see below for how to get one).
2. `go run ./cmd/server`
3. Visit `http://localhost:8080/api/health`.

On startup the server does one synchronous fetch from all three
platforms before it starts listening, then keeps refreshing that data in
the background every `CACHE_TTL` (default 15 minutes). Requests to the
API never hit the network themselves -- they just read whatever the
cache last successfully fetched.

### Getting a GitHub token

GitHub's GraphQL API requires authentication for every request, even for
public data. Create a classic token at
[github.com/settings/tokens](https://github.com/settings/tokens) ->
"Generate new token" -> "Generate new token (classic)". No scopes need to
be checked for public data -- an unscoped token is enough. Put it in
`.env` as `GITHUB_TOKEN`.

## API

Every response is `{"data": ...}` on success or `{"error": "..."}` on
failure.

| Method & path | Returns |
|---|---|
| `GET /api/health` | `{status, statsFetchedAt, lastFetchError?}` |
| `GET /api/stats/problems` | problems solved, by difficulty, per platform |
| `GET /api/stats/ratings` | contest rating history, per platform |
| `GET /api/stats/heatmap` | combined daily activity across all 3 platforms |
| `GET /api/stats/combined` | all of the above in one payload (for the frontend's first load) |

`/api/stats/*` return `503` if the very first fetch from the platforms
has never succeeded (e.g. bad token at startup). Once at least one fetch
has succeeded, they keep serving that data even if later background
refreshes fail.

## Project layout

```
cmd/server/main.go        entrypoint: config, wiring, graceful shutdown
internal/
  config/                 env var loading + validation
  platform/
    github/               GitHub GraphQL client (contribution calendar, profile)
    leetcode/              LeetCode GraphQL client (solved stats, calendar, contests)
    codeforces/             Codeforces REST client (rating history, submissions)
  stats/                  normalizes all 3 platforms into shared models,
                          fetches them concurrently, merges the heatmap
  cache/                  generic in-memory TTL cache + background refresher
  httpapi/                HTTP handlers, router, middleware
```

Each `platform/*` package only knows about its own upstream API and
returns its own idiomatic Go types. `stats` is the only package that
converts those into shared domain models (`stats.Snapshot`) -- so if
LeetCode changes their API tomorrow, only `platform/leetcode` and the
small `stats/*.go` conversion functions need to change.

## Design notes / things worth knowing

- **No database.** Rating history and calendars are re-derived from each
  platform's API on every refresh; the in-memory cache is the only
  persistence. If you outgrow this (e.g. want to keep history beyond
  what each API exposes, or run multiple instances), swapping in
  SQLite/Postgres would replace `internal/cache` without touching
  `internal/stats` or `internal/httpapi`.
- **Codeforces has no easy/medium/hard label**, only a numeric problem
  `rating`. `internal/stats/problems.go` buckets it (`<1200` easy,
  `1200-1899` medium, `>=1900` hard) to match LeetCode's shape. Tune the
  thresholds in that file if they don't feel right once you see your own
  data.
- **The aggregator fails all-or-nothing per fetch.** If any one of the
  9 upstream calls fails, the whole `Fetch` fails, and the cache just
  keeps serving its last complete snapshot instead of a mismatched
  partial one.
- **LeetCode's endpoint is unofficial** (`https://leetcode.com/graphql`)
  and rejects requests without browser-like headers -- that's why the
  client sets a `User-Agent`/`Referer`.

## Testing

```
go test ./... -race
```

Unit tests cover the Codeforces solved-problem dedup logic, the
combined-heatmap merge, the difficulty-bucketing logic, and the HTTP
handlers (via `httptest`, with a fake cache -- no network calls in the
test suite).

## What's next

- A React + GSAP frontend consuming `/api/stats/combined` (CORS is
  already configured via `ALLOWED_ORIGIN`).
- Possibly: multi-year rating history beyond what a single API call
  window covers, WebSocket/SSE push instead of polling, Redis if this
  ever needs to run as more than one instance.
