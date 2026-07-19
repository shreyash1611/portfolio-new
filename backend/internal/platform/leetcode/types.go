package leetcode

// ProblemsSolved is the public shape we hand back to callers -- already
// normalized out of LeetCode's rather awkward acSubmissionNum list format.
type ProblemsSolved struct {
	Easy   int
	Medium int
	Hard   int
	Total  int
}

// ContestStats is the user's current contest standing.
type ContestStats struct {
	AttendedContests int
	CurrentRating    float64
	GlobalRanking    int
}

// RatingPoint is one attended contest's effect on rating -- the building
// block of a rating-over-time chart.
type RatingPoint struct {
	ContestTitle string
	Timestamp    int64
	Rating       float64
}

// --- Raw GraphQL response shapes below. These mirror LeetCode's JSON
// exactly (unexported, package-private) so the public types above can stay
// clean regardless of how awkward the upstream schema is. ---

type problemsSolvedData struct {
	MatchedUser *struct {
		SubmitStatsGlobal struct {
			AcSubmissionNum []struct {
				Difficulty string `json:"difficulty"`
				Count      int    `json:"count"`
			} `json:"acSubmissionNum"`
		} `json:"submitStatsGlobal"`
	} `json:"matchedUser"`
}

type contestData struct {
	UserContestRanking *struct {
		AttendedContestsCount int     `json:"attendedContestsCount"`
		Rating                float64 `json:"rating"`
		GlobalRanking         int     `json:"globalRanking"`
	} `json:"userContestRanking"`
	UserContestRankingHistory []struct {
		Attended bool    `json:"attended"`
		Rating   float64 `json:"rating"`
		Contest  struct {
			Title     string `json:"title"`
			StartTime int64  `json:"startTime"`
		} `json:"contest"`
	} `json:"userContestRankingHistory"`
}

type calendarData struct {
	MatchedUser *struct {
		UserCalendar struct {
			// LeetCode returns this as a JSON-encoded string (not a nested
			// object), e.g. "{\"1700000000\":3}" -- it needs a second
			// json.Unmarshal pass, done in SubmissionCalendar below.
			SubmissionCalendar string `json:"submissionCalendar"`
		} `json:"userCalendar"`
	} `json:"matchedUser"`
}
