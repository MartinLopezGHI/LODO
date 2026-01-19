package middleware

import "net/http"

// RBAC is a placeholder. It will enforce role-based access control in a later step.
func RBAC(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)
	})
}
