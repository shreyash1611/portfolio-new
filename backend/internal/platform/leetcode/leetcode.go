// Package leetcode is a client for LeetCode's unofficial GraphQL endpoint
// (https://leetcode.com/graphql). There is no official public API, so this
// client is intentionally defensive about parsing failures.
package leetcode

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const endpoint = "https://leetcode.com/graphql"

// Client fetches data for a single LeetCode username.
type Client struct {
	username   string
	httpClient *http.Client
}

func NewClient(username string) *Client {
	return &Client{
		username:   username,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// Username returns the configured LeetCode username.
func (c *Client) Username() string { return c.username }

type graphQLRequest struct {
	Query     string         `json:"query"`
	Variables map[string]any `json:"variables"`
}

// graphQLResponse is generic over T because every query returns a
// differently-shaped "data" object.
type graphQLResponse[T any] struct {
	Data   T `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors"`
}

func doGraphQL[T any](ctx context.Context, httpClient *http.Client, query string, variables map[string]any) (T, error) {
	var zero T

	body, err := json.Marshal(graphQLRequest{Query: query, Variables: variables})
	if err != nil {
		return zero, fmt.Errorf("leetcode: encoding request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return zero, fmt.Errorf("leetcode: building request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	// LeetCode's edge rejects requests that don't look like they came from
	// a browser, even for public data -- a plain Go User-Agent gets a 403.
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; portfolio-backend/1.0)")
	req.Header.Set("Referer", "https://leetcode.com")

	resp, err := httpClient.Do(req)
	if err != nil {
		return zero, fmt.Errorf("leetcode: request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return zero, fmt.Errorf("leetcode: unexpected status %d", resp.StatusCode)
	}

	var parsed graphQLResponse[T]
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return zero, fmt.Errorf("leetcode: decoding response: %w", err)
	}
	if len(parsed.Errors) > 0 {
		return zero, fmt.Errorf("leetcode: api error: %s", parsed.Errors[0].Message)
	}
	return parsed.Data, nil
}
