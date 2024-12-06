package main

import (
	"log"
	"net/http"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/api"
	mw "github.com/TherapistTrack/Therapisttrack-Backend-V2/api/middlewares"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/config"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services/user"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/pkg"
	"github.com/go-chi/chi/v5"
	"github.com/joho/godotenv"
)

func main() {
	// Loading env variables from .env file
	godotenv.Load()
	config := config.LoadConfig()

	// Logging
	pkg.ConfigureLogger(config.LoggingConfig)

	// Services
	userService := user.NewUserService()

	// App
	app := api.NewApi(&userService)

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
		r.Delete("/users", mw.CheckPermissions([]string{"delete:users"})(app.CreateUserHandler))
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
	log.Printf("Starting server on port %s", config.APIPort)
	log.Fatal(http.ListenAndServe(":"+config.APIPort, r))
}
