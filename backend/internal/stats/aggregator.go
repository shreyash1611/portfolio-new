package stats

import (
	"context"
	"fmt"
	"log"
	"sync"
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
// Snapshot. GitHub + LeetCode failures still fail the whole fetch (they're
// required for a useful Skills panel). Codeforces is best-effort: Render
// (and other cloud hosts) often time out talking to codeforces.com, and
// we'd rather serve GH/LC data with empty CF fields than serve nothing.
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

	requiredErr := runConcurrently(
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
	)
	if requiredErr != nil {
		return Snapshot{}, fmt.Errorf("fetching platform data: %w", requiredErr)
	}

	// Fetch CF pieces independently (and concurrently) so a slow
	// submissions call doesn't wipe rating/profile when those succeed.
	var cfWG sync.WaitGroup
	cfWG.Add(3)
	go func() {
		defer cfWG.Done()
		info, err := a.codeforces.UserInfo(ctx)
		if err != nil {
			log.Printf("codeforces user info unavailable: %v", err)
			cfInfo = codeforces.UserInfo{Handle: a.codeforces.Handle()}
			return
		}
		cfInfo = info
	}()
	go func() {
		defer cfWG.Done()
		ratings, err := a.codeforces.RatingHistory(ctx)
		if err != nil {
			log.Printf("codeforces rating history unavailable: %v", err)
			return
		}
		cfRatings = ratings
	}()
	go func() {
		defer cfWG.Done()
		subs, err := a.codeforces.Submissions(ctx)
		if err != nil {
			log.Printf("codeforces submissions unavailable: %v", err)
			return
		}
		cfSubs = subs
	}()
	cfWG.Wait()

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
