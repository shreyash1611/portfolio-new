package leetcode

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
)

const problemsSolvedQuery = `
query userProblemsSolved($username: String!) {
  matchedUser(username: $username) {
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
  }
}`

// ProblemsSolved returns the accepted-submission counts by difficulty.
func (c *Client) ProblemsSolved(ctx context.Context) (ProblemsSolved, error) {
	data, err := doGraphQL[problemsSolvedData](ctx, c.httpClient, problemsSolvedQuery, map[string]any{"username": c.username})
	if err != nil {
		return ProblemsSolved{}, err
	}
	if data.MatchedUser == nil {
		return ProblemsSolved{}, fmt.Errorf("leetcode: no user found for username %q", c.username)
	}

	var result ProblemsSolved
	for _, entry := range data.MatchedUser.SubmitStatsGlobal.AcSubmissionNum {
		switch entry.Difficulty {
		case "All":
			result.Total = entry.Count
		case "Easy":
			result.Easy = entry.Count
		case "Medium":
			result.Medium = entry.Count
		case "Hard":
			result.Hard = entry.Count
		}
	}
	return result, nil
}

const contestHistoryQuery = `
query userContestInfo($username: String!) {
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
  }
  userContestRankingHistory(username: $username) {
    attended
    rating
    contest {
      title
      startTime
    }
  }
}`

// ContestHistory returns the user's current contest standing plus a
// chronological rating history (unattended contests are filtered out --
// LeetCode carries the rating forward at a flat 1500 baseline for those,
// which would just add flat noise to a rating graph).
func (c *Client) ContestHistory(ctx context.Context) (ContestStats, []RatingPoint, error) {
	data, err := doGraphQL[contestData](ctx, c.httpClient, contestHistoryQuery, map[string]any{"username": c.username})
	if err != nil {
		return ContestStats{}, nil, err
	}

	var stats ContestStats
	if data.UserContestRanking != nil {
		stats = ContestStats{
			AttendedContests: data.UserContestRanking.AttendedContestsCount,
			CurrentRating:    data.UserContestRanking.Rating,
			GlobalRanking:    data.UserContestRanking.GlobalRanking,
		}
	}

	var history []RatingPoint
	for _, entry := range data.UserContestRankingHistory {
		if !entry.Attended {
			continue
		}
		history = append(history, RatingPoint{
			ContestTitle: entry.Contest.Title,
			Timestamp:    entry.Contest.StartTime,
			Rating:       entry.Rating,
		})
	}
	return stats, history, nil
}

const submissionCalendarQuery = `
query userProfileCalendar($username: String!, $year: Int) {
  matchedUser(username: $username) {
    userCalendar(year: $year) {
      submissionCalendar
    }
  }
}`

// SubmissionCalendar returns a map of "start of day" Unix timestamp to
// submission count for the given year.
func (c *Client) SubmissionCalendar(ctx context.Context, year int) (map[int64]int, error) {
	data, err := doGraphQL[calendarData](ctx, c.httpClient, submissionCalendarQuery, map[string]any{
		"username": c.username,
		"year":     year,
	})
	if err != nil {
		return nil, err
	}
	if data.MatchedUser == nil {
		return nil, fmt.Errorf("leetcode: no user found for username %q", c.username)
	}

	raw := map[string]int{}
	if err := json.Unmarshal([]byte(data.MatchedUser.UserCalendar.SubmissionCalendar), &raw); err != nil {
		return nil, fmt.Errorf("leetcode: decoding submission calendar: %w", err)
	}

	calendar := make(map[int64]int, len(raw))
	for key, count := range raw {
		ts, err := strconv.ParseInt(key, 10, 64)
		if err != nil {
			continue // skip anything that isn't a clean Unix timestamp
		}
		calendar[ts] = count
	}
	return calendar, nil
}
