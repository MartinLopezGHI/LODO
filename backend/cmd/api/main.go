package main

import (
	"log"
	"net/http"
	"strings"

	"backend/internal/audit"
	"backend/internal/auth"
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/geocoding"
	httpmw "backend/internal/http"
	"backend/internal/organizations"
	"backend/internal/taxonomies"
)

func main() {
	// 1. Cargar configuración (variables de entorno)
	cfg := config.Load()

	// 2. Conectar a la base de datos (MariaDB limpia con 001_init.sql)
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("MariaDB connected")

	// 3. Inicializar capas del módulo Organizations (Inyección de dependencias)
	orgRepo := organizations.NewRepository(db)
	auditRepo := audit.NewRepository(db)
	taxRepo := taxonomies.NewRepository(db)
	
	geocoder := geocoding.NewNominatimClient("LODO-Geocode-MVP")
	// Ahora (Pasando el geocoder que ya tienes instanciado):
	orgService := organizations.NewService(orgRepo, auditRepo, taxRepo, geocoder)
	orgHandler := organizations.NewHandler(orgService, orgRepo, geocoder)

	taxHandler := taxonomies.NewHandler(taxRepo)

	// Inicializar módulo Auth
	authRepo := auth.NewRepository(db)
	authHandler := auth.NewHandler(authRepo)

	// 4. Router HTTP Principal
	mux := http.NewServeMux()

	// --- RUTAS PÚBLICAS ---
	publicMux := http.NewServeMux()

	publicMux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Endpoints públicos alineados a la nueva estructura
	publicMux.HandleFunc("/public/organizations", orgHandler.ListPublic)
	publicMux.HandleFunc("/public/organizations/aggregates", orgHandler.Aggregates)
	publicMux.HandleFunc("/public/organizations/", func(w http.ResponseWriter, r *http.Request) {
		// Evitar colisión con la ruta base
		if r.URL.Path == "/public/organizations/" {
			http.Error(w, "Not found", http.StatusNotFound)
			return
		}
		orgHandler.GetPublicByID(w, r)
	})

	publicMux.HandleFunc("/public/taxonomies", taxHandler.ListPublic)

	// Rutas de Autenticación
	publicMux.HandleFunc("/auth/login", authHandler.Login)
	publicMux.HandleFunc("/auth/register", authHandler.Register)
	publicMux.HandleFunc("/auth/me", authHandler.Me)
	publicMux.HandleFunc("/auth/logout", authHandler.Logout)

	// --- RUTAS DE ADMINISTRACIÓN (Protegidas) ---
	adminMux := http.NewServeMux()

	// Listar y Crear (Rutas base)
	adminMux.HandleFunc("/organizations", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			orgHandler.List(w, r)
		case http.MethodPost:
			orgHandler.Create(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Detalle, Ciclo de vida y Geocoding
	adminMux.HandleFunc("/organizations/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		
		// Enrutamiento basado en sufijos de acción
		switch {
		case strings.HasSuffix(path, "/review"):
			orgHandler.SubmitForReview(w, r)
		case strings.HasSuffix(path, "/publish"):
			orgHandler.Publish(w, r)
		case strings.HasSuffix(path, "/archive"):
			orgHandler.Archive(w, r)
		case strings.HasSuffix(path, "/geocode"):
			orgHandler.Geocode(w, r)
		case strings.HasSuffix(path, "/coordinates"):
			orgHandler.PatchCoordinates(w, r)
		default:
			// CRUD Estándar por ID
			switch r.Method {
			case http.MethodGet:
				orgHandler.GetByID(w, r)
			case http.MethodPut, http.MethodPost: // Soporte para ambos para Update
				orgHandler.Update(w, r)
			case http.MethodDelete:
				orgHandler.Delete(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		}
	})

	// 5. Unificación y Middlewares
	// Aplicamos CORS a todo y Auth solo a /organizations
	mux.Handle("/public/", publicMux)
	mux.Handle("/auth/", publicMux)
	mux.Handle("/health", publicMux)
	
	// El middleware AuthWithUser protege el acceso administrativo
	mux.Handle("/organizations", httpmw.AuthWithUser(cfg, adminMux))
	mux.Handle("/organizations/", httpmw.AuthWithUser(cfg, adminMux))

	log.Println("Server running on :8080")
	// Aplicar el middleware de CORS globalmente
	log.Fatal(http.ListenAndServe(":8080", httpmw.CORS(mux)))
}