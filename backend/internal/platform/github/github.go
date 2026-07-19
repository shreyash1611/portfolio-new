// Package github is a client for GitHub's GraphQL API v4
// (https://docs.github.com/en/graphql), used to fetch contribution
// calendar data for the authenticated profile.
package github

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const endpoint = "https://api.github.com/graphql"

// Client fetches data for a single GitHub username. Unlike Codeforces and
// LeetCode, GitHub's GraphQL API requires authentication for every
// request, even for public data -- hence the token.
type Client struct {
	username   string
	token      string
	httpClient *http.Client
}

func NewClient(username, token string) *Client {
	return &Client{
		username:   username,
		token:      token,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// Username returns the configured GitHub username.
func (c *Client) Username() string { return c.username }

type graphQLRequest struct {
	Query     string         `json:"query"`
	Variables map[string]any `json:"variables"`
}

type graphQLResponse[T any] struct {
	Data   T `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors"`
}

// doGraphQL is a free function rather than a method, because Go methods
// can't introduce their own type parameters (only free functions can) --
// the receiver's fields we need (httpClient, token) are just passed in.
func doGraphQL[T any](ctx context.Context, httpClient *http.Client, token, query string, variables map[string]any) (T, error) {
	var zero T

	body, err := json.Marshal(graphQLRequest{Query: query, Variables: variables})
	if err != nil {
		return zero, fmt.Errorf("github: encoding request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return zero, fmt.Errorf("github: building request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("User-Agent", "portfolio-backend")

	resp, err := httpClient.Do(req)
	if err != nil {
		return zero, fmt.Errorf("github: request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return zero, fmt.Errorf("github: unauthorized -- check GITHUB_TOKEN is valid")
	}
	if resp.StatusCode != http.StatusOK {
		return zero, fmt.Errorf("github: unexpected status %d", resp.StatusCode)
	}

	var parsed graphQLResponse[T]
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return zero, fmt.Errorf("github: decoding response: %w", err)
	}
	if len(parsed.Errors) > 0 {
		return zero, fmt.Errorf("github: api error: %s", parsed.Errors[0].Message)
	}
	return parsed.Data, nil
}
