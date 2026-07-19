package stats

import (
	"testing"
	"time"

	"portfolio/backend/internal/platform/codeforces"
	"portfolio/backend/internal/platform/github"
)

func TestBuildHeatmapMergesAllThreePlatformsByDate(t *testing.T) {
	unix := func(date string) int64 {
		ts, err := time.Parse("2006-01-02", date)
		if err != nil {
			t.Fatalf("bad test date %q: %v", date, err)
		}
		return ts.Unix()
	}

	ghDays := []github.ContributionDay{
		{Date: "2026-01-01", Count: 3},
		{Date: "2026-01-02", Count: 0},
	}

	// Two "years" of LeetCode calendars, deliberately overlapping the same
	// date once, to verify counts from multiple calendars are summed
	// rather than overwritten.
	lcCalendars := []map[int64]int{
		{unix("2026-01-01"): 2},
		{unix("2026-01-01"): 1, unix("2026-01-03"): 5},
	}

	cfSubs := []codeforces.Submission{
		{CreationTimeSeconds: unix("2026-01-02")},
		{CreationTimeSeconds: unix("2026-01-02")}, // two submissions same day -> count 2
	}

	days := buildHeatmap(ghDays, lcCalendars, cfSubs)

	byDate := make(map[string]HeatmapDay)
	for _, d := range days {
		byDate[d.Date] = d
	}

	tests := []struct {
		date string
		want HeatmapDay
	}{
		{"2026-01-01", HeatmapDay{Date: "2026-01-01", GitHub: 3, LeetCode: 3, Codeforces: 0, Total: 6}},
		{"2026-01-02", HeatmapDay{Date: "2026-01-02", GitHub: 0, LeetCode: 0, Codeforces: 2, Total: 2}},
		{"2026-01-03", HeatmapDay{Date: "2026-01-03", GitHub: 0, LeetCode: 5, Codeforces: 0, Total: 5}},
	}
	for _, tt := range tests {
		got, ok := byDate[tt.date]
		if !ok {
			t.Errorf("missing day %s in output", tt.date)
			continue
		}
		if got != tt.want {
			t.Errorf("day %s = %+v, want %+v", tt.date, got, tt.want)
		}
	}

	if len(days) != 3 {
		t.Errorf("got %d days, want 3", len(days))
	}

	for i := 1; i < len(days); i++ {
		if days[i-1].Date > days[i].Date {
			t.Errorf("days not sorted: %s appears before %s", days[i-1].Date, days[i].Date)
		}
	}
}
