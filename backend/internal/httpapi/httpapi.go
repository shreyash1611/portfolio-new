// Package httpapi wires together the HTTP handlers, middleware and router
// for the portfolio stats API.
package httpapi

import (
	"net/http"

	"portfolio/backend/internal/cache"
	"portfolio/backend/internal/config"
	"portfolio/backend/internal/stats"
)

// NewRouter builds the full HTTP handler for the server. Go 1.22's
// http.ServeMux understands "METHOD /path" patterns natively, so we don't
// need a third-party router for a service this size.
//
// Requests flow through the middleware chain outside-in:
// withRecover -> withLogging -> withCORS -> mux
func NewRouter(cfg config.Config, statsCache *cache.Cache[stats.Snapshot]) http.Handler {
	h := &handlers{cache: statsCache}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", h.handleHealth)
	mux.HandleFunc("GET /api/stats/problems", h.handleProblems)
	mux.HandleFunc("GET /api/stats/ratings", h.handleRatings)
	mux.HandleFunc("GET /api/stats/heatmap", h.handleHeatmap)
	mux.HandleFunc("GET /api/stats/combined", h.handleCombined)

	var handler http.Handler = mux
	handler = withCORS(cfg.AllowedOrigin, handler)
	handler = withLogging(handler)
	handler = withRecover(handler)
	return handler
}
