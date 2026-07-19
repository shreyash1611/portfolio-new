package httpapi

import (
	"log"
	"net/http"
	"time"
)

// statusRecorder wraps a ResponseWriter so middleware can observe the status
// code a handler wrote. The standard http.ResponseWriter interface is
// write-only (no getter for the status), so wrapping it is the idiomatic
// way to add that.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

// withLogging logs one line per request: method, path, response status and
// how long the handler took.
func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(rec, r)

		log.Printf("%s %s -> %d (%s)", r.Method, r.URL.Path, rec.status, time.Since(start))
	})
}

// withCORS allows the configured frontend origin to call this API from the
// browser. Without this, the browser's same-origin policy would silently
// block every fetch() from the React app running on a different port.
func withCORS(allowedOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Browsers send an OPTIONS "preflight" request before certain
		// cross-origin requests to ask permission -- reply immediately.
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// withRecover turns a panic anywhere in a handler into a 500 response
// instead of crashing the whole server process.
func withRecover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("panic recovered: %v", err)
				writeError(w, http.StatusInternalServerError, "internal server error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}
