package codeforces

// UserInfo is the subset of Codeforces' user.info response we care about.
// See https://codeforces.com/apiHelp/objects#User
type UserInfo struct {
	Handle    string `json:"handle"`
	Rating    int    `json:"rating"`
	MaxRating int    `json:"maxRating"`
	Rank      string `json:"rank"`
	MaxRank   string `json:"maxRank"`
}

// RatingChange is one entry from user.rating: a single contest's effect on
// the user's rating. A full history of these is exactly what a rating
// graph needs.
// See https://codeforces.com/apiHelp/objects#RatingChange
type RatingChange struct {
	ContestID               int    `json:"contestId"`
	ContestName             string `json:"contestName"`
	Rank                    int    `json:"rank"`
	RatingUpdateTimeSeconds int64  `json:"ratingUpdateTimeSeconds"`
	OldRating               int    `json:"oldRating"`
	NewRating               int    `json:"newRating"`
}

// Submission is one entry from user.status.
// See https://codeforces.com/apiHelp/objects#Submission
type Submission struct {
	ID                  int64   `json:"id"`
	CreationTimeSeconds int64   `json:"creationTimeSeconds"`
	Verdict             string  `json:"verdict"`
	Problem             Problem `json:"problem"`
}

// Problem identifies a Codeforces problem. Problems don't have an
// easy/medium/hard label like LeetCode -- instead they carry a numeric
// difficulty Rating (roughly 800-3500).
// See https://codeforces.com/apiHelp/objects#Problem
type Problem struct {
	ContestID int    `json:"contestId"`
	Index     string `json:"index"`
	Name      string `json:"name"`
	Rating    int    `json:"rating"`
}
