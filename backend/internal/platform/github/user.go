package github

import (
	"context"
	"fmt"
	"time"
)

const contributionCalendarQuery = `
query userContributions($username: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $username) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}`

// ContributionCalendar returns one entry per day between from and to
// (inclusive), which GitHub caps at a 1-year span per call. Days with zero
// contributions are still included, so the result lines up cleanly with
// LeetCode's and Codeforces' calendars when merged into a combined
// heatmap.
func (c *Client) ContributionCalendar(ctx context.Context, from, to time.Time) ([]ContributionDay, error) {
	data, err := doGraphQL[contributionData](ctx, c.httpClient, c.token, contributionCalendarQuery, map[string]any{
		"username": c.username,
		"from":     from.UTC().Format(time.RFC3339),
		"to":       to.UTC().Format(time.RFC3339),
	})
	if err != nil {
		return nil, err
	}
	if data.User == nil {
		return nil, fmt.Errorf("github: no user found for username %q", c.username)
	}

	var days []ContributionDay
	for _, week := range data.User.ContributionsCollection.ContributionCalendar.Weeks {
		for _, day := range week.ContributionDays {
			days = append(days, ContributionDay{Date: day.Date, Count: day.ContributionCount})
		}
	}
	return days, nil
}

const profileStatsQuery = `
query userProfileStats($username: String!) {
  user(login: $username) {
    followers {
      totalCount
    }
    repositories(ownerAffiliations: OWNER, isFork: false) {
      totalCount
    }
  }
}`

// ProfileStats returns follower and public-repo counts.
func (c *Client) ProfileStats(ctx context.Context) (ProfileStats, error) {
	data, err := doGraphQL[profileData](ctx, c.httpClient, c.token, profileStatsQuery, map[string]any{
		"username": c.username,
	})
	if err != nil {
		return ProfileStats{}, err
	}
	if data.User == nil {
		return ProfileStats{}, fmt.Errorf("github: no user found for username %q", c.username)
	}

	return ProfileStats{
		Followers:   data.User.Followers.TotalCount,
		PublicRepos: data.User.Repositories.TotalCount,
	}, nil
}
