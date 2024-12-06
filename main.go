package main

import (
	"log"
	"net/http"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/api/handlers/health"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/api/middlewares"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/config"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/pkg"
	"github.com/go-chi/chi/v5"
	"github.com/joho/godotenv"
)

func main() {
	// Loading env variables from .env file
	godotenv.Load()
	config := config.LoadConfig()

	// Logging
	pkg.ConfigureLogger(pkg.LoggerConfig{
		Output: config.LoggingMethod,
		Path:   config.LoggingFilePath,
	})

	// Routes
	r := chi.NewRouter()

	r.Use(middlewares.LoggingMiddleware)
	r.Use(middlewares.CreateCorsMiddleware(
		config.AllowedOrigins,
		config.AllowedMethods,
		config.AllowedHeaders,
	))

	r.Get("/health", health.CheckHealthHandler)

	// Start server
	log.Printf("Starting server on port %s", config.APIPort)
	log.Fatal(http.ListenAndServe(":"+config.APIPort, r))
}
