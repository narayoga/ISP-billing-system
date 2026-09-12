package auth

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/all-over/isp-billing-service/internal/httpx"
)

// Claims = payload JWT yang diterbitkan isp-api-service (HS256).
type Claims struct {
	Type  string `json:"type"`
	Sub   int64  `json:"sub"`
	Email string `json:"email"`
	Role  string `json:"role"`
	Exp   int64  `json:"exp"`
}

// Verify memvalidasi token JWT HS256 dengan shared secret (tanpa dependency luar).
func Verify(token, secret string) (Claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return Claims{}, errors.New("malformed token")
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(parts[0] + "." + parts[1]))
	expected := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(expected), []byte(parts[2])) {
		return Claims{}, errors.New("bad signature")
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return Claims{}, err
	}
	var c Claims
	if err := json.Unmarshal(payload, &c); err != nil {
		return Claims{}, err
	}
	if c.Exp > 0 && time.Now().Unix() > c.Exp {
		return Claims{}, errors.New("token expired")
	}
	return c, nil
}

type ctxKey struct{}

// RequireSuperadmin middleware: butuh JWT admin dengan role superadmin.
func RequireSuperadmin(secret string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// disable auth for development purposes
		if os.Getenv("DISABLE_AUTH") == "true" {
			fakeAdmin := Claims{Type: "admin", Sub: 1, Email: "admin@isp.local", Role: "superadmin"}
			next(w, r.WithContext(context.WithValue(r.Context(), ctxKey{}, fakeAdmin)))
			return
		}

		h := r.Header.Get("Authorization")
		if !strings.HasPrefix(h, "Bearer ") {
			httpx.Error(w, http.StatusUnauthorized, "unauthenticated")
			return
		}
		c, err := Verify(strings.TrimPrefix(h, "Bearer "), secret)
		if err != nil || c.Type != "admin" {
			httpx.Error(w, http.StatusUnauthorized, "invalid_token")
			return
		}
		if c.Role != "superadmin" {
			httpx.Error(w, http.StatusForbidden, "forbidden")
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), ctxKey{}, c)))
	}
}

// RequireAdmin middleware: butuh JWT admin (role apa pun: superadmin / cs).
func RequireAdmin(secret string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// disable auth for development purposes
		if os.Getenv("DISABLE_AUTH") == "true" {
			fakeAdmin := Claims{Type: "admin", Sub: 1, Email: "admin@isp.local", Role: "superadmin"}
			next(w, r.WithContext(context.WithValue(r.Context(), ctxKey{}, fakeAdmin)))
			return
		}

		h := r.Header.Get("Authorization")
		if !strings.HasPrefix(h, "Bearer ") {
			httpx.Error(w, http.StatusUnauthorized, "unauthenticated")
			return
		}
		c, err := Verify(strings.TrimPrefix(h, "Bearer "), secret)
		if err != nil || c.Type != "admin" {
			httpx.Error(w, http.StatusUnauthorized, "invalid_token")
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), ctxKey{}, c)))
	}
}

// FromContext mengambil claims yang diset middleware.
func FromContext(ctx context.Context) Claims {
	c, _ := ctx.Value(ctxKey{}).(Claims)
	return c
}
