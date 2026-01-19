package middleware

import "net/http"

// Auth is a placeholder. It will enforce JWT authentication in a later step.
func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)
	})
}
