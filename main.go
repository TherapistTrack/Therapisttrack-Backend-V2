package main

import (
	"fmt"
	"net/http"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/api"
	mw "github.com/TherapistTrack/Therapisttrack-Backend-V2/api/middlewares"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/config"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/storage/mongo_cli"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/pkg"
	"github.com/go-chi/chi/v5"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

// TRANSPORTE
// NEGOCIOS
// DATOS

func main() {
	// Loading env variables from .env file
	godotenv.Load()
	config := config.LoadConfig()

	// Logging
	pkg.ConfigureLogger(&config.LoggingConfig)

	// Database Client
	mongoClient, err := mongo_cli.NewMongoClient(&config.DatabaseConfig)

	defer mongoClient.Close()

	if err != nil {
		log.Fatal().
			Str("message", "Could not initialize DB Client").
			Err(err)
	}

	// App and Services Configuration
	app := api.NewApi(mongoClient)

	// Routes
	r := chi.NewRouter()

	r.Use(mw.Logging)
	r.Use(mw.CreateCors(config.CorsConfig))

	r.Get("/health", app.CheckHealthHandler)

	r.Group(func(r chi.Router) {
		r.Use(mw.CheckJWT)

		// Users
		r.Get("/users/list", mw.CheckPermissions([]string{"read:users"})(app.CreateUserHandler))
		r.Get("/users/@me", mw.CheckPermissions([]string{"read:users"})(app.CreateUserHandler))
		r.Get("/users/:id", mw.CheckPermissions([]string{"read:users"})(app.CreateUserHandler))
		r.Post("/users", mw.CheckPermissions([]string{"create:users"})(app.CreateUserHandler))
		r.Delete("/users", mw.CheckPermissions([]string{"delete:users"})(app.DeleteUserHandler))
		r.Put("/users", mw.CheckPermissions([]string{"update:users"})(app.CreateUserHandler))

		// RecordTemplate
		// ...

		// FileTemplate
		// ...

		// Records
		// ...

		// File
		// ...
	})

	// Start server
	log.Info().Msg(fmt.Sprintf("Starting server on port %s", config.APIPort))
	log.Fatal().Err(http.ListenAndServe(":"+config.APIPort, r))
}
