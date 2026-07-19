// Package codeforces is a client for the public Codeforces REST API:
// https://codeforces.com/apiHelp
package codeforces

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

const baseURL = "https://codeforces.com/api"

// Client fetches data for a single Codeforces handle.
type Client struct {
	handle     string
	httpClient *http.Client
}

func NewClient(handle string) *Client {
	return &Client{
		handle:     handle,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// apiResponse mirrors the envelope every Codeforces API call returns:
// https://codeforces.com/apiHelp -- "status" is either "OK" or "FAILED".
// It's a generic type parameterized on the shape of "result", since that
// shape differs per method ([]UserInfo, []RatingChange, []Submission, ...).
type apiResponse[T any] struct {
	Status  string `json:"status"`
	Comment string `json:"comment"`
	Result  T      `json:"result"`
}

// doRequest calls a Codeforces API method and decodes its "result" field
// into T. Go can't infer a type parameter from a return value alone, so
// callers must specify it explicitly, e.g. doRequest[[]UserInfo](...).
func doRequest[T any](ctx context.Context, httpClient *http.Client, method string, query url.Values) (T, error) {
	var zero T

	query.Set("lang", "en")
	reqURL := fmt.Sprintf("%s/%s?%s", baseURL, method, query.Encode())

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return zero, fmt.Errorf("codeforces: building request: %w", err)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return zero, fmt.Errorf("codeforces: request failed: %w", err)
	}
	defer resp.Body.Close()

	var parsed apiResponse[T]
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return zero, fmt.Errorf("codeforces: decoding response: %w", err)
	}

	if parsed.Status != "OK" {
		return zero, fmt.Errorf("codeforces: api error: %s", parsed.Comment)
	}
	return parsed.Result, nil
}
