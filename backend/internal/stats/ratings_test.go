package stats

import (
	"testing"
	"time"

	"portfolio/backend/internal/platform/codeforces"
	"portfolio/backend/internal/platform/leetcode"
)

func TestBuildRatingHistory(t *testing.T) {
	ts, err := time.Parse("2006-01-02", "2026-03-15")
	if err != nil {
		t.Fatal(err)
	}

	lcHistory := []leetcode.RatingPoint{
		{ContestTitle: "Weekly Contest 400", Timestamp: ts.Unix(), Rating: 1801.5},
	}
	cfHistory := []codeforces.RatingChange{
		{ContestName: "Codeforces Round 999", RatingUpdateTimeSeconds: ts.Unix(), NewRating: 1350},
	}

	got := buildRatingHistory(lcHistory, cfHistory)

	if len(got.LeetCode) != 1 || len(got.Codeforces) != 1 {
		t.Fatalf("got %d leetcode points and %d codeforces points, want 1 each", len(got.LeetCode), len(got.Codeforces))
	}

	wantLC := RatingPoint{Date: "2026-03-15", Rating: 1801.5, Label: "Weekly Contest 400"}
	if got.LeetCode[0] != wantLC {
		t.Errorf("LeetCode[0] = %+v, want %+v", got.LeetCode[0], wantLC)
	}

	wantCF := RatingPoint{Date: "2026-03-15", Rating: 1350, Label: "Codeforces Round 999"}
	if got.Codeforces[0] != wantCF {
		t.Errorf("Codeforces[0] = %+v, want %+v", got.Codeforces[0], wantCF)
	}
}
