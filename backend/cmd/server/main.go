package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"portfolio/backend/internal/cache"
	"portfolio/backend/internal/config"
	"portfolio/backend/internal/httpapi"
	"portfolio/backend/internal/platform/codeforces"
	"portfolio/backend/internal/platform/github"
	"portfolio/backend/internal/platform/leetcode"
	"portfolio/backend/internal/stats"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	aggregator := stats.NewAggregator(
		github.NewClient(cfg.GitHubUsername, cfg.GitHubToken),
		leetcode.NewClient(cfg.LeetCodeUsername),
		codeforces.NewClient(cfg.CodeforcesHandle),
	)

	// signal.NotifyContext gives us a context that's cancelled the moment
	// the process receives Ctrl+C (SIGINT) or a termination signal
	// (SIGTERM). Everything long-lived below (the cache's background
	// refresher, the HTTP server) watches this same context to know when
	// to shut down.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	log.Println("fetching initial stats snapshot from GitHub, LeetCode and Codeforces...")
	statsCache := cache.New(ctx, aggregator.Fetch)
	if statsCache.LastError() != nil {
		log.Printf("warning: initial fetch failed, starting anyway: %v", statsCache.LastError())
	}
	go statsCache.Start(ctx, cfg.CacheTTL)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      httpapi.NewRouter(cfg, statsCache),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("listening on http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("shutdown signal received, draining in-flight requests...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("graceful shutdown failed: %v", err)
	}
	log.Println("server stopped")
}
