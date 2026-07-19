// Package cache provides a generic in-memory TTL cache with a background
// refresh loop, so HTTP handlers never block on slow/rate-limited upstream
// APIs.
package cache

import (
	"context"
	"log"
	"sync"
	"time"
)

// Fetcher produces a fresh value of T, or an error if the fetch failed.
type Fetcher[T any] func(ctx context.Context) (T, error)

// Cache holds the most recently *successfully* fetched value of T. A
// background goroutine (started by Start) refreshes it on a timer.
// Get always returns instantly because it never touches the network --
// it just reads whatever the last successful fetch produced.
type Cache[T any] struct {
	fetch Fetcher[T]

	mu        sync.RWMutex
	value     T
	haveValue bool
	fetchedAt time.Time
	lastErr   error
}

// New creates a cache and performs one synchronous fetch immediately, so
// the server doesn't start up with an empty cache and a cold first
// request. If this initial fetch fails, the cache starts empty and Get
// reports !ok until the first successful background refresh.
func New[T any](ctx context.Context, fetch Fetcher[T]) *Cache[T] {
	c := &Cache[T]{fetch: fetch}
	c.refresh(ctx)
	return c
}

// Start blocks, calling refresh every interval until ctx is cancelled.
// Run this in its own goroutine (`go statsCache.Start(ctx, ttl)`).
func (c *Cache[T]) Start(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			c.refresh(ctx)
		}
	}
}

func (c *Cache[T]) refresh(ctx context.Context) {
	value, err := c.fetch(ctx)

	c.mu.Lock()
	defer c.mu.Unlock()

	if err != nil {
		c.lastErr = err
		log.Printf("cache: refresh failed, continuing to serve previous value: %v", err)
		return // deliberately don't touch c.value -- keep serving the last good one
	}

	c.value = value
	c.haveValue = true
	c.fetchedAt = time.Now()
	c.lastErr = nil
}

// Get returns the most recently cached value and when it was fetched. ok
// is false only if no fetch has ever succeeded.
func (c *Cache[T]) Get() (value T, fetchedAt time.Time, ok bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.value, c.fetchedAt, c.haveValue
}

// LastError returns the error from the most recent fetch attempt, even
// while an older successful value is still being served -- useful for a
// health/debug endpoint to surface "data may be stale because X".
func (c *Cache[T]) LastError() error {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.lastErr
}
