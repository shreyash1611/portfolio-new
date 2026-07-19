package httpapi

import (
	"encoding/json"
	"log"
	"net/http"
)

// envelope is the consistent JSON shape every endpoint responds with, so the
// frontend can always check `error` before trusting `data`.
type envelope struct {
	Data  any    `json:"data,omitempty"`
	Error string `json:"error,omitempty"`
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(envelope{Data: data}); err != nil {
		log.Printf("writeJSON encode: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(envelope{Error: message}); err != nil {
		log.Printf("writeError encode: %v", err)
	}
}
