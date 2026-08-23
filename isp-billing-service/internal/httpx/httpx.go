package httpx

import (
	"encoding/json"
	"net/http"
)

// JSON menulis response JSON dengan status code tertentu.
func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// Error menulis body { "error": code }.
func Error(w http.ResponseWriter, status int, code string) {
	JSON(w, status, map[string]string{"error": code})
}
