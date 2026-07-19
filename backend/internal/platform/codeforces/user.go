package codeforces

import (
	"context"
	"fmt"
	"net/url"
)

// UserInfo fetches the handle's current/max rating and rank.
func (c *Client) UserInfo(ctx context.Context) (UserInfo, error) {
	query := url.Values{"handles": {c.handle}}

	users, err := doRequest[[]UserInfo](ctx, c.httpClient, "user.info", query)
	if err != nil {
		return UserInfo{}, err
	}
	if len(users) == 0 {
		return UserInfo{}, fmt.Errorf("codeforces: no user found for handle %q", c.handle)
	}
	return users[0], nil
}

// RatingHistory fetches every rated contest the handle has participated
// in, oldest first -- exactly the series a rating-over-time chart needs.
func (c *Client) RatingHistory(ctx context.Context) ([]RatingChange, error) {
	query := url.Values{"handle": {c.handle}}
	return doRequest[[]RatingChange](ctx, c.httpClient, "user.rating", query)
}

// Submissions fetches the raw submission list (used later by the
// aggregator to build the combined activity heatmap from submission
// timestamps).
func (c *Client) Submissions(ctx context.Context) ([]Submission, error) {
	query := url.Values{
		"handle": {c.handle},
		"from":   {"1"},
		"count":  {"100000"},
	}
	return doRequest[[]Submission](ctx, c.httpClient, "user.status", query)
}

// SolvedProblems returns the set of distinct problems this handle has an
// accepted ("OK" verdict) submission for. Codeforces doesn't expose a
// "solved count" field directly -- we derive it from the submission list.
func (c *Client) SolvedProblems(ctx context.Context) ([]Problem, error) {
	submissions, err := c.Submissions(ctx)
	if err != nil {
		return nil, err
	}
	return DedupeSolved(submissions), nil
}

// DedupeSolved filters submissions down to the set of distinct accepted
// problems, deduplicating by contest+index since the same problem can be
// submitted (and re-submitted) many times. It's exported so callers that
// already fetched submissions for another reason (e.g. building a
// heatmap) can reuse them here instead of fetching twice.
func DedupeSolved(submissions []Submission) []Problem {
	seen := make(map[string]struct{})
	var solved []Problem
	for _, sub := range submissions {
		if sub.Verdict != "OK" {
			continue
		}
		key := fmt.Sprintf("%d%s", sub.Problem.ContestID, sub.Problem.Index)
		if _, alreadyCounted := seen[key]; alreadyCounted {
			continue
		}
		seen[key] = struct{}{}
		solved = append(solved, sub.Problem)
	}
	return solved
}
