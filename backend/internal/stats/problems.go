package stats

import (
	"portfolio/backend/internal/platform/codeforces"
	"portfolio/backend/internal/platform/leetcode"
)

// Codeforces problems don't have an Easy/Medium/Hard label, only a numeric
// difficulty Rating (roughly 800-3500). These thresholds are an
// approximation to make Codeforces problems bucket similarly to
// LeetCode's difficulty tiers -- tune them if they don't feel right once
// you see your own data on the frontend.
const (
	codeforcesEasyMaxRating   = 1200
	codeforcesMediumMaxRating = 1900
)

func buildProblemsSolved(lc leetcode.ProblemsSolved, cfSolved []codeforces.Problem) ProblemsSolved {
	cf := PlatformProblems{Total: len(cfSolved)}
	for _, p := range cfSolved {
		switch {
		case p.Rating == 0:
			// Unrated problem (e.g. some gym/April Fools problems) --
			// counted in Total but not bucketed into a difficulty tier.
		case p.Rating < codeforcesEasyMaxRating:
			cf.Easy++
		case p.Rating < codeforcesMediumMaxRating:
			cf.Medium++
		default:
			cf.Hard++
		}
	}

	return ProblemsSolved{
		LeetCode: PlatformProblems{
			Easy:   lc.Easy,
			Medium: lc.Medium,
			Hard:   lc.Hard,
			Total:  lc.Total,
		},
		Codeforces: cf,
	}
}
