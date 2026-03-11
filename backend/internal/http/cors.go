package httpmw

import "net/http"

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Lista de orígenes permitidos actualizada para Docker y Producción
		allowedOrigins := map[string]bool{
			"http://localhost":      true, // Frontend en Docker (puerto 80)
			"http://127.0.0.1":      true, // IP local estándar
			"http://localhost:5173": true, // Desarrollo manual con Vite
			"https://lodo-frontend-412424314458.southamerica-east1.run.app": true, // Producción Cloud Run
		}

		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			// Agregamos Credentials por si usas Cookies o Auth persistente en el futuro
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		// Importante: El preflight (OPTIONS) debe responder 204
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
