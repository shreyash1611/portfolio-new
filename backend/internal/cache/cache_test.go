package cache

import (
	"context"
	"errors"
	"sync/atomic"
	"testing"
	"time"
)

func TestNewPerformsSynchronousInitialFetch(t *testing.T) {
	c := New(context.Background(), func(ctx context.Context) (int, error) {
		return 42, nil
	})

	value, _, ok := c.Get()
	if !ok {
		t.Fatal("expected ok=true after a successful initial fetch")
	}
	if value != 42 {
		t.Fatalf("value = %d, want 42", value)
	}
}

func TestGetReportsNotOkWhenInitialFetchFails(t *testing.T) {
	c := New(context.Background(), func(ctx context.Context) (int, error) {
		return 0, errors.New("boom")
	})

	if _, _, ok := c.Get(); ok {
		t.Fatal("expected ok=false when the initial fetch failed")
	}
	if c.LastError() == nil {
		t.Fatal("expected LastError to be set after a failed fetch")
	}
}

func TestRefreshKeepsServingStaleValueOnError(t *testing.T) {
	var callCount atomic.Int32

	c := New(context.Background(), func(ctx context.Context) (int, error) {
		n := callCount.Add(1)
		if n == 1 {
			return 100, nil // first call (the synchronous one in New) succeeds
		}
		return 0, errors.New("upstream is down") // every later call fails
	})

	// Manually trigger what Start's ticker would do, to test refresh
	// without waiting on a real timer.
	c.refresh(context.Background())

	value, _, ok := c.Get()
	if !ok || value != 100 {
		t.Fatalf("Get() = (%d, ok=%v), want (100, true) -- stale value should survive a failed refresh", value, ok)
	}
	if c.LastError() == nil {
		t.Fatal("expected LastError to be set even though the stale value is still served")
	}
}

func TestStartStopsWhenContextCancelled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	c := New(ctx, func(ctx context.Context) (int, error) { return 1, nil })

	done := make(chan struct{})
	go func() {
		c.Start(ctx, time.Millisecond)
		close(done)
	}()

	cancel()

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("Start did not return after context cancellation")
	}
}
