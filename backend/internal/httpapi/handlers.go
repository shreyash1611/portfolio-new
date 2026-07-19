package httpapi

import (
	"net/http"

	"portfolio/backend/internal/cache"
	"portfolio/backend/internal/stats"
)

// handlers holds the dependencies every route needs. Right now that's
// just the stats cache, but this struct is the natural place to add a
// logger or other shared dependency later -- it avoids handler functions
// needing package-level globals.
type handlers struct {
	cache *cache.Cache[stats.Snapshot]
}

func (h *handlers) handleHealth(w http.ResponseWriter, r *http.Request) {
	_, fetchedAt, ok := h.cache.Get()

	status := "ok"
	if !ok {
		// The server is up, but we've never had a successful fetch from
		// GitHub/LeetCode/Codeforces (e.g. bad token, or they were all
		// down at startup).
		status = "degraded"
	}

	resp := map[string]any{
		"status":         status,
		"statsFetchedAt": fetchedAt,
	}
	if err := h.cache.LastError(); err != nil {
		resp["lastFetchError"] = err.Error()
	}
	writeJSON(w, http.StatusOK, resp)
}

// snapshot fetches the cached snapshot, writing a 503 response itself if
// none is available yet. Callers just check the returned bool.
func (h *handlers) snapshot(w http.ResponseWriter) (stats.Snapshot, bool) {
	snap, _, ok := h.cache.Get()
	if !ok {
		writeError(w, http.StatusServiceUnavailable,
			"stats aren't available yet -- the initial fetch from GitHub/LeetCode/Codeforces hasn't succeeded")
		return stats.Snapshot{}, false
	}
	return snap, true
}

func (h *handlers) handleProblems(w http.ResponseWriter, r *http.Request) {
	if snap, ok := h.snapshot(w); ok {
		writeJSON(w, http.StatusOK, snap.ProblemsSolved)
	}
}

func (h *handlers) handleRatings(w http.ResponseWriter, r *http.Request) {
	if snap, ok := h.snapshot(w); ok {
		writeJSON(w, http.StatusOK, snap.Ratings)
	}
}

func (h *handlers) handleHeatmap(w http.ResponseWriter, r *http.Request) {
	if snap, ok := h.snapshot(w); ok {
		writeJSON(w, http.StatusOK, snap.Heatmap)
	}
}

func (h *handlers) handleCombined(w http.ResponseWriter, r *http.Request) {
	if snap, ok := h.snapshot(w); ok {
		writeJSON(w, http.StatusOK, snap)
	}
}
