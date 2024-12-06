package middlewares

import (
	"net/http"
	"time"

	"github.com/rs/zerolog/log"
)

// LoggingMiddleware logs the details of each incoming HTTP request.
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Wrap the ResponseWriter to capture the status code
		wrappedWriter := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		start := time.Now()
		next.ServeHTTP(wrappedWriter, r)
		duration := time.Since(start)

		// Log the request details using zerolog
		log.Info().
			Str("method", r.Method).
			Str("route", r.URL.Path).
			Int("status", wrappedWriter.statusCode).
			Int64("unix", start.Unix()).
			Dur("duration", duration).
			Msg("Request processed")
	})
}

// responseWriter is a wrapper around http.ResponseWriter to capture the status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

// WriteHeader captures the status code and delegates the call to the underlying ResponseWriter
func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
