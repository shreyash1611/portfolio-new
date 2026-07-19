package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"portfolio/backend/internal/cache"
	"portfolio/backend/internal/config"
	"portfolio/backend/internal/stats"
)

func testConfig() config.Config {
	return config.Config{Port: "0", AllowedOrigin: "http://localhost:5173"}
}

func TestHealthReportsOkWhenCacheHasData(t *testing.T) {
	statsCache := cache.New(context.Background(), func(ctx context.Context) (stats.Snapshot, error) {
		return stats.Snapshot{}, nil
	})
	router := NewRouter(testConfig(), statsCache)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/health", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}

	var body envelope
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decoding response: %v", err)
	}
	data := body.Data.(map[string]any)
	if data["status"] != "ok" {
		t.Errorf("status field = %v, want %q", data["status"], "ok")
	}
}

func TestHealthReportsDegradedWhenCacheIsEmpty(t *testing.T) {
	statsCache := cache.New(context.Background(), func(ctx context.Context) (stats.Snapshot, error) {
		return stats.Snapshot{}, errUpstreamDown
	})
	router := NewRouter(testConfig(), statsCache)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/health", nil))

	var body envelope
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decoding response: %v", err)
	}
	data := body.Data.(map[string]any)
	if data["status"] != "degraded" {
		t.Errorf("status field = %v, want %q", data["status"], "degraded")
	}
}

func TestCombinedReturns503WhenCacheIsEmpty(t *testing.T) {
	statsCache := cache.New(context.Background(), func(ctx context.Context) (stats.Snapshot, error) {
		return stats.Snapshot{}, errUpstreamDown
	})
	router := NewRouter(testConfig(), statsCache)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/stats/combined", nil))

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusServiceUnavailable)
	}
}

func TestCombinedReturnsSnapshotWhenCacheIsPopulated(t *testing.T) {
	want := stats.Snapshot{
		ProblemsSolved: stats.ProblemsSolved{
			LeetCode: stats.PlatformProblems{Total: 42},
		},
	}
	statsCache := cache.New(context.Background(), func(ctx context.Context) (stats.Snapshot, error) {
		return want, nil
	})
	router := NewRouter(testConfig(), statsCache)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/stats/combined", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}

	var body struct {
		Data stats.Snapshot `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decoding response: %v", err)
	}
	if body.Data.ProblemsSolved.LeetCode.Total != 42 {
		t.Errorf("ProblemsSolved.LeetCode.Total = %d, want 42", body.Data.ProblemsSolved.LeetCode.Total)
	}
}

func TestUnknownRouteReturns404(t *testing.T) {
	statsCache := cache.New(context.Background(), func(ctx context.Context) (stats.Snapshot, error) {
		return stats.Snapshot{}, nil
	})
	router := NewRouter(testConfig(), statsCache)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/nope", nil))

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusNotFound)
	}
}

var errUpstreamDown = &staticError{"upstream is down"}

type staticError struct{ msg string }

func (e *staticError) Error() string { return e.msg }
