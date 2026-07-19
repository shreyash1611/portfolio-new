package stats

import (
	"testing"

	"portfolio/backend/internal/platform/codeforces"
	"portfolio/backend/internal/platform/leetcode"
)

func TestBuildProblemsSolved(t *testing.T) {
	lc := leetcode.ProblemsSolved{Easy: 10, Medium: 20, Hard: 5, Total: 35}
	cf := []codeforces.Problem{
		{Rating: 800},  // easy
		{Rating: 1199}, // easy (just under threshold)
		{Rating: 1200}, // medium (at threshold)
		{Rating: 1899}, // medium
		{Rating: 1900}, // hard (at threshold)
		{Rating: 2400}, // hard
		{Rating: 0},    // unrated -- counted in Total only
	}

	got := buildProblemsSolved(lc, cf)

	wantLC := PlatformProblems{Easy: 10, Medium: 20, Hard: 5, Total: 35}
	if got.LeetCode != wantLC {
		t.Errorf("LeetCode = %+v, want %+v", got.LeetCode, wantLC)
	}

	wantCF := PlatformProblems{Easy: 2, Medium: 2, Hard: 2, Total: 7}
	if got.Codeforces != wantCF {
		t.Errorf("Codeforces = %+v, want %+v", got.Codeforces, wantCF)
	}
}
