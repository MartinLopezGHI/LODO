package http

import (
	"log"
	nethttp "net/http"

	"github.com/MartinLopezGHI/lodo_map/services/api/internal/http/handlers/admin"
	"github.com/MartinLopezGHI/lodo_map/services/api/internal/http/handlers/public"
	"github.com/MartinLopezGHI/lodo_map/services/api/internal/http/middleware"
)

func NewRouter(l *log.Logger) nethttp.Handler {
	mux := nethttp.NewServeMux()

	mux.HandleFunc("GET /public/health", public.Health)
	mux.HandleFunc("GET /internal/health", admin.Health)

	var h nethttp.Handler = mux
	h = middleware.RequestID(h)
	h = middleware.Logging(l)(h)

	return h
}
