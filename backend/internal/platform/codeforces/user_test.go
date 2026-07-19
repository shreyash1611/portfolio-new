package codeforces

import "testing"

func TestDedupeSolved(t *testing.T) {
	tests := []struct {
		name        string
		submissions []Submission
		wantCount   int
		wantNames   []string // in the order DedupeSolved should return them
	}{
		{
			name:        "no submissions",
			submissions: nil,
			wantCount:   0,
		},
		{
			name: "single accepted submission counts once",
			submissions: []Submission{
				{Verdict: "OK", Problem: Problem{ContestID: 1, Index: "A", Name: "Watermelon"}},
			},
			wantCount: 1,
			wantNames: []string{"Watermelon"},
		},
		{
			name: "resubmitting the same accepted problem doesn't double count",
			submissions: []Submission{
				{Verdict: "WRONG_ANSWER", Problem: Problem{ContestID: 1, Index: "A", Name: "Watermelon"}},
				{Verdict: "OK", Problem: Problem{ContestID: 1, Index: "A", Name: "Watermelon"}},
				{Verdict: "OK", Problem: Problem{ContestID: 1, Index: "A", Name: "Watermelon"}}, // e.g. resubmitted for practice
			},
			wantCount: 1,
			wantNames: []string{"Watermelon"},
		},
		{
			name: "non-OK verdicts are excluded entirely",
			submissions: []Submission{
				{Verdict: "WRONG_ANSWER", Problem: Problem{ContestID: 1, Index: "A"}},
				{Verdict: "TIME_LIMIT_EXCEEDED", Problem: Problem{ContestID: 2, Index: "B"}},
			},
			wantCount: 0,
		},
		{
			name: "same index in different contests are distinct problems",
			submissions: []Submission{
				{Verdict: "OK", Problem: Problem{ContestID: 1, Index: "A", Name: "First A"}},
				{Verdict: "OK", Problem: Problem{ContestID: 2, Index: "A", Name: "Second A"}},
			},
			wantCount: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := DedupeSolved(tt.submissions)
			if len(got) != tt.wantCount {
				t.Fatalf("DedupeSolved() returned %d problems, want %d (%+v)", len(got), tt.wantCount, got)
			}
			for i, wantName := range tt.wantNames {
				if got[i].Name != wantName {
					t.Errorf("problem[%d].Name = %q, want %q", i, got[i].Name, wantName)
				}
			}
		})
	}
}
