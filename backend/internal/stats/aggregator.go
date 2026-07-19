package stats

import (
	"context"
	"fmt"
	"time"

	"portfolio/backend/internal/platform/codeforces"
	"portfolio/backend/internal/platform/github"
	"portfolio/backend/internal/platform/leetcode"
)

// Aggregator fetches from all three platforms concurrently and normalizes
// the results into a single Snapshot.
type Aggregator struct {
	github     *github.Client
	leetcode   *leetcode.Client
	codeforces *codeforces.Client
}

func NewAggregator(gh *github.Client, lc *leetcode.Client, cf *codeforces.Client) *Aggregator {
	return &Aggregator{github: gh, leetcode: lc, codeforces: cf}
}

// Fetch calls every platform concurrently and merges the results into one
// Snapshot. If any single call fails, the whole Fetch fails -- there is no
// partial snapshot. That's a deliberate choice: resilience comes from the
// cache layer (internal/cache) continuing to serve the last *complete*
// successful snapshot when a refresh fails, rather than this layer trying
// to patch together an inconsistent partial one.
func (a *Aggregator) Fetch(ctx context.Context) (Snapshot, error) {
	var (
		ghDays    []github.ContributionDay
		ghProfile github.ProfileStats

		lcSolved       leetcode.ProblemsSolved
		lcStats        leetcode.ContestStats
		lcHistory      []leetcode.RatingPoint
		lcCalendarThis map[int64]int
		lcCalendarLast map[int64]int

		cfInfo    codeforces.UserInfo
		cfRatings []codeforces.RatingChange
		cfSubs    []codeforces.Submission
	)

	now := time.Now()

	err := runConcurrently(
		named("github contribution calendar", func() (err error) {
			ghDays, err = a.github.ContributionCalendar(ctx, now.AddDate(-1, 0, 0), now)
			return err
		}),
		named("github profile", func() (err error) {
			ghProfile, err = a.github.ProfileStats(ctx)
			return err
		}),
		named("leetcode problems solved", func() (err error) {
			lcSolved, err = a.leetcode.ProblemsSolved(ctx)
			return err
		}),
		named("leetcode contest history", func() (err error) {
			lcStats, lcHistory, err = a.leetcode.ContestHistory(ctx)
			return err
		}),
		named("leetcode calendar (this year)", func() (err error) {
			lcCalendarThis, err = a.leetcode.SubmissionCalendar(ctx, now.Year())
			return err
		}),
		named("leetcode calendar (last year)", func() (err error) {
			lcCalendarLast, err = a.leetcode.SubmissionCalendar(ctx, now.Year()-1)
			return err
		}),
		named("codeforces user info", func() (err error) {
			cfInfo, err = a.codeforces.UserInfo(ctx)
			return err
		}),
		named("codeforces rating history", func() (err error) {
			cfRatings, err = a.codeforces.RatingHistory(ctx)
			return err
		}),
		named("codeforces submissions", func() (err error) {
			cfSubs, err = a.codeforces.Submissions(ctx)
			return err
		}),
	)
	if err != nil {
		return Snapshot{}, fmt.Errorf("fetching platform data: %w", err)
	}

	cfSolved := codeforces.DedupeSolved(cfSubs)

	return Snapshot{
		GeneratedAt:    now,
		ProblemsSolved: buildProblemsSolved(lcSolved, cfSolved),
		Ratings:        buildRatingHistory(lcHistory, cfRatings),
		Heatmap:        buildHeatmap(ghDays, []map[int64]int{lcCalendarThis, lcCalendarLast}, cfSubs),
		Profiles: Profiles{
			GitHub: GitHubProfile{
				Username:    a.github.Username(),
				Followers:   ghProfile.Followers,
				PublicRepos: ghProfile.PublicRepos,
			},
			LeetCode: LeetCodeProfile{
				Username:         a.leetcode.Username(),
				Rating:           lcStats.CurrentRating,
				GlobalRanking:    lcStats.GlobalRanking,
				AttendedContests: lcStats.AttendedContests,
			},
			Codeforces: CodeforcesProfile{
				Handle:    cfInfo.Handle,
				Rating:    cfInfo.Rating,
				MaxRating: cfInfo.MaxRating,
				Rank:      cfInfo.Rank,
				MaxRank:   cfInfo.MaxRank,
			},
		},
	}, nil
}

// named wraps a task with a label, so a failure deep in errors.Join's
// combined error is still easy to attribute to a specific upstream call.
func named(label string, fn func() error) task {
	return func() error {
		if err := fn(); err != nil {
			return fmt.Errorf("%s: %w", label, err)
		}
		return nil
	}
}
