// Package stats normalizes data from the github, leetcode and codeforces
// platform clients into shared domain models and aggregates them
// concurrently.
package stats

import "time"

// PlatformProblems is a difficulty breakdown of solved problems for one
// platform.
type PlatformProblems struct {
	Easy   int `json:"easy"`
	Medium int `json:"medium"`
	Hard   int `json:"hard"`
	Total  int `json:"total"`
}

// ProblemsSolved is the difficulty breakdown per platform. LeetCode
// reports difficulty directly; Codeforces problems only carry a numeric
// rating, so we bucket that into the same easy/medium/hard shape (see
// problems.go) to keep the frontend's rendering code platform-agnostic.
type ProblemsSolved struct {
	LeetCode   PlatformProblems `json:"leetcode"`
	Codeforces PlatformProblems `json:"codeforces"`
}

// RatingPoint is one contest's effect on rating, normalized to a plain
// calendar date so LeetCode and Codeforces points can be plotted on the
// same timeline.
type RatingPoint struct {
	Date   string  `json:"date"`
	Rating float64 `json:"rating"`
	Label  string  `json:"label"`
}

// RatingHistory holds each platform's rating series independently (the
// two rating scales aren't directly comparable, so we don't merge them --
// the frontend can render them as two lines on a shared time axis).
type RatingHistory struct {
	LeetCode   []RatingPoint `json:"leetcode"`
	Codeforces []RatingPoint `json:"codeforces"`
}

// HeatmapDay is one square of the combined activity heatmap: how many
// contributions/submissions happened on this UTC calendar day, broken
// down by platform.
type HeatmapDay struct {
	Date       string `json:"date"`
	GitHub     int    `json:"github"`
	LeetCode   int    `json:"leetcode"`
	Codeforces int    `json:"codeforces"`
	Total      int    `json:"total"`
}

type GitHubProfile struct {
	Username    string `json:"username"`
	Followers   int    `json:"followers"`
	PublicRepos int    `json:"publicRepos"`
}

type LeetCodeProfile struct {
	Username         string  `json:"username"`
	Rating           float64 `json:"rating"`
	GlobalRanking    int     `json:"globalRanking"`
	AttendedContests int     `json:"attendedContests"`
}

type CodeforcesProfile struct {
	Handle    string `json:"handle"`
	Rating    int    `json:"rating"`
	MaxRating int    `json:"maxRating"`
	Rank      string `json:"rank"`
	MaxRank   string `json:"maxRank"`
}

type Profiles struct {
	GitHub     GitHubProfile     `json:"github"`
	LeetCode   LeetCodeProfile   `json:"leetcode"`
	Codeforces CodeforcesProfile `json:"codeforces"`
}

// Snapshot is the full normalized output of one aggregation pass across
// all three platforms. This is the shape that gets cached (internal/cache)
// and served to the frontend.
type Snapshot struct {
	GeneratedAt    time.Time      `json:"generatedAt"`
	ProblemsSolved ProblemsSolved `json:"problemsSolved"`
	Ratings        RatingHistory  `json:"ratings"`
	Heatmap        []HeatmapDay   `json:"heatmap"`
	Profiles       Profiles       `json:"profiles"`
}
