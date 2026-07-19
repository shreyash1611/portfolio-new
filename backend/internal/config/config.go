// Package config loads application configuration (profile handles, secrets,
// server settings) from environment variables.
package config

import (
	"bufio"
	"fmt"
	"os"
	"sort"
	"strings"
	"time"
)

// Config holds every setting the server needs at startup. Keeping it as one
// plain struct (rather than reading env vars all over the codebase) means
// there is exactly one place that knows about the outside world's
// configuration -- everything else just receives a Config value.
type Config struct {
	Port          string
	AllowedOrigin string
	CacheTTL      time.Duration

	GitHubUsername   string
	GitHubToken      string
	LeetCodeUsername string
	CodeforcesHandle string
}

// Load reads configuration from environment variables. It first loads a
// local .env file (if present) into the process environment; real
// environment variables (e.g. exported in your shell, or set by a hosting
// provider) always take precedence over values from .env.
func Load() (Config, error) {
	loadDotEnv(".env")

	ttl, err := time.ParseDuration(getEnv("CACHE_TTL", "15m"))
	if err != nil {
		return Config{}, fmt.Errorf("parsing CACHE_TTL: %w", err)
	}

	cfg := Config{
		Port:          getEnv("PORT", "8080"),
		AllowedOrigin: getEnv("ALLOWED_ORIGIN", "http://localhost:5173"),
		CacheTTL:      ttl,

		GitHubUsername:   os.Getenv("GITHUB_USERNAME"),
		GitHubToken:      os.Getenv("GITHUB_TOKEN"),
		LeetCodeUsername: os.Getenv("LEETCODE_USERNAME"),
		CodeforcesHandle: os.Getenv("CODEFORCES_HANDLE"),
	}

	if err := cfg.validate(); err != nil {
		return Config{}, err
	}
	return cfg, nil
}

// validate reports every missing required setting at once (instead of
// failing on the first one), so you can fix your .env in a single pass.
func (c Config) validate() error {
	required := map[string]string{
		"GITHUB_USERNAME":   c.GitHubUsername,
		"GITHUB_TOKEN":      c.GitHubToken,
		"LEETCODE_USERNAME": c.LeetCodeUsername,
		"CODEFORCES_HANDLE": c.CodeforcesHandle,
	}

	var missing []string
	for name, value := range required {
		if value == "" {
			missing = append(missing, name)
		}
	}
	if len(missing) == 0 {
		return nil
	}

	sort.Strings(missing) // map iteration order is random in Go; sort for a stable error message
	return fmt.Errorf("missing required environment variables: %s (copy .env.example to .env and fill them in)", strings.Join(missing, ", "))
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// loadDotEnv reads simple KEY=VALUE pairs from a .env file and sets them as
// process environment variables. A missing file is not an error -- .env is
// optional (e.g. a real deployment would set env vars directly instead).
// Any key that is already set in the environment is left untouched, so
// real env vars always win over .env.
func loadDotEnv(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		key, value, hasEquals := strings.Cut(line, "=")
		if !hasEquals {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.Trim(strings.TrimSpace(value), `"'`)

		if _, alreadySet := os.LookupEnv(key); !alreadySet {
			os.Setenv(key, value)
		}
	}
}
