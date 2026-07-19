package stats

import (
	"time"

	"portfolio/backend/internal/platform/codeforces"
	"portfolio/backend/internal/platform/leetcode"
)

func buildRatingHistory(lcHistory []leetcode.RatingPoint, cfHistory []codeforces.RatingChange) RatingHistory {
	lcPoints := make([]RatingPoint, 0, len(lcHistory))
	for _, p := range lcHistory {
		lcPoints = append(lcPoints, RatingPoint{
			Date:   time.Unix(p.Timestamp, 0).UTC().Format("2006-01-02"),
			Rating: p.Rating,
			Label:  p.ContestTitle,
		})
	}

	cfPoints := make([]RatingPoint, 0, len(cfHistory))
	for _, c := range cfHistory {
		cfPoints = append(cfPoints, RatingPoint{
			Date:   time.Unix(c.RatingUpdateTimeSeconds, 0).UTC().Format("2006-01-02"),
			Rating: float64(c.NewRating),
			Label:  c.ContestName,
		})
	}

	return RatingHistory{LeetCode: lcPoints, Codeforces: cfPoints}
}
