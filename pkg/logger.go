package pkg

import (
	"os"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

type LoggerConfig struct {
	Output string // "console" or "file"
	Path   string // File path (if Output is "file")
}

// ConfigureLogger sets up the zerolog output based on the provided configuration
func ConfigureLogger(config LoggerConfig) {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	switch config.Output {
	case "CONSOLE":
		// Use a human-readable console output
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout})
	case "FILE":
		// Write logs to the specified file
		file, err := os.OpenFile(config.Path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to open log file")
		}
		log.Logger = log.Output(file)
	default:
		// Default to JSON logging to console
		log.Logger = log.Output(os.Stdout)
	}
}
