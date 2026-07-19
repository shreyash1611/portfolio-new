package stats

import (
	"sort"
	"time"

	"portfolio/backend/internal/platform/codeforces"
	"portfolio/backend/internal/platform/github"
)

// buildHeatmap merges GitHub's daily contribution calendar, one or more
// years of LeetCode's submission calendar, and Codeforces' raw submission
// timestamps into one combined-by-date activity map.
//
// All three platforms count *all* activity for the day (not just
// successful/accepted), so the merged heatmap represents "how much did I
// do that day" rather than "how much did I solve that day" -- consistent
// with how GitHub's own heatmap treats commits.
func buildHeatmap(ghDays []github.ContributionDay, lcCalendars []map[int64]int, cfSubs []codeforces.Submission) []HeatmapDay {
	byDate := make(map[string]*HeatmapDay)

	dayFor := func(date string) *HeatmapDay {
		day, exists := byDate[date]
		if !exists {
			day = &HeatmapDay{Date: date}
			byDate[date] = day
		}
		return day
	}

	for _, d := range ghDays {
		dayFor(d.Date).GitHub += d.Count
	}

	for _, calendar := range lcCalendars {
		for unixSeconds, count := range calendar {
			date := time.Unix(unixSeconds, 0).UTC().Format("2006-01-02")
			dayFor(date).LeetCode += count
		}
	}

	for _, sub := range cfSubs {
		date := time.Unix(sub.CreationTimeSeconds, 0).UTC().Format("2006-01-02")
		dayFor(date).Codeforces++
	}

	days := make([]HeatmapDay, 0, len(byDate))
	for _, day := range byDate {
		day.Total = day.GitHub + day.LeetCode + day.Codeforces
		days = append(days, *day)
	}
	sort.Slice(days, func(i, j int) bool { return days[i].Date < days[j].Date })
	return days
}
