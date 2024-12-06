package middlewares

import (
	"net/http"

	"github.com/go-chi/cors"
)

// CreateCorsMiddleware creates and returns a CORS middleware with custom options.
func CreateCorsMiddleware(allowedOrigins []string, allowedMethods []string, allowedHeaders []string) func(http.Handler) http.Handler {
	return cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins, // Specify allowed origins
		AllowedMethods:   allowedMethods, // Specify allowed HTTP methods
		AllowedHeaders:   allowedHeaders, // Specify allowed headers
		AllowCredentials: true,           // Allow credentials like cookies, authorization headers, etc.
		MaxAge:           300,            // Cache duration for preflight requests
	})
}
