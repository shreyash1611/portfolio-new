package github

// ContributionDay is one square in the GitHub contribution heatmap.
type ContributionDay struct {
	Date  string // "YYYY-MM-DD", UTC
	Count int
}

// ProfileStats is a handful of extra profile numbers worth showing
// alongside the heatmap.
type ProfileStats struct {
	Followers   int
	PublicRepos int
}

// --- Raw GraphQL response shapes below, mirroring GitHub's schema. ---

type contributionData struct {
	User *struct {
		ContributionsCollection struct {
			ContributionCalendar struct {
				TotalContributions int `json:"totalContributions"`
				Weeks              []struct {
					ContributionDays []struct {
						Date              string `json:"date"`
						ContributionCount int    `json:"contributionCount"`
					} `json:"contributionDays"`
				} `json:"weeks"`
			} `json:"contributionCalendar"`
		} `json:"contributionsCollection"`
	} `json:"user"`
}

type profileData struct {
	User *struct {
		Followers struct {
			TotalCount int `json:"totalCount"`
		} `json:"followers"`
		Repositories struct {
			TotalCount int `json:"totalCount"`
		} `json:"repositories"`
	} `json:"user"`
}
