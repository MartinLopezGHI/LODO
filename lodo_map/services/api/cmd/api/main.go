package main

import (
	"net/http"
	"time"

	"github.com/MartinLopezGHI/lodo_map/services/api/internal/config"
	apphttp "github.com/MartinLopezGHI/lodo_map/services/api/internal/http"
	"github.com/MartinLopezGHI/lodo_map/services/api/internal/observability"
)

func main() {
	cfg := config.Load()
	logger := observability.NewLogger()
	router := apphttp.NewRouter(logger)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	logger.Printf("api listening on %s", srv.Addr)
	if err := srv.ListenAndServe(); err != nil {
		logger.Printf("server stopped: %v", err)
	}
}
