package config

import (
	"log"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	APIPort     string
	RunningMode string

	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string

	// Cors
	AllowedOrigins      []string
	AllowedContentTypes []string
	AllowedMethods      []string
	AllowedHeaders      []string

	// Logging
	LoggingMethod   string
	LoggingFilePath string

	// Auth0
	AuthClientId      string
	AuthClientSecret  string
	AuthAudience      string
	AuthIssuerBaseUrl string

	// S3
	AwsAccessKeyID     string
	AwsSecretAccessKey string
	AwsRegion          string
	AwsBucketName      string
	AwsBucketNameTest  string
}

// LoadConfig loads configuration from environment variables.
// It exits with a fatal error if any required variable is missing.
func LoadConfig() Config {
	return Config{
		APIPort:     mustGetEnv("API_PORT"),
		RunningMode: mustGetEnv("RUNNING_MODE"),

		// Database
		DBHost:     mustGetEnv("DB_HOST"),
		DBPort:     mustGetEnv("DB_PORT"),
		DBUser:     mustGetEnv("DB_USER"),
		DBPassword: mustGetEnv("DB_USER_PASSWORD"),
		DBName:     mustGetEnv("DB_NAME"),

		// Cors
		AllowedOrigins:      mustGetEnvAsStringSlice("ALLOWED_ORIGINS"),
		AllowedContentTypes: mustGetEnvAsStringSlice("ALLOWED_CONTENT_TYPES"),
		AllowedMethods:      mustGetEnvAsStringSlice("ALLOWED_METHODS"),
		AllowedHeaders:      mustGetEnvAsStringSlice("ALLOWED_HEADERS"),

		// Logging
		LoggingMethod:   mustGetEnv("LOGGING_METHOD"),
		LoggingFilePath: mustGetEnv("LOGGING_FILE_PATH"),

		// AUTH0
		AuthClientId:      mustGetEnv("AUTH_CLIENT_ID"),
		AuthClientSecret:  mustGetEnv("AUTH_CLIENT_SECRET"),
		AuthAudience:      mustGetEnv("AUTH_AUDIENCE"),
		AuthIssuerBaseUrl: mustGetEnv("AUTH_ISSUER_BASE_URL"),

		// S3
		AwsAccessKeyID:     mustGetEnv("AWS_ACCESS_KEY_ID"),
		AwsSecretAccessKey: mustGetEnv("AWS_SECRET_ACCESS_KEY"),
		AwsRegion:          mustGetEnv("AWS_REGION"),
		AwsBucketName:      mustGetEnv("AWS_BUCKET_NAME"),
		AwsBucketNameTest:  mustGetEnv("AWS_BUCKET_NAME_TEST"),
	}
}

// mustGetEnv retrieves the value of the given environment variable
// or exits with a fatal error if the variable is not set.
func mustGetEnv(key string) string {
	value, exists := os.LookupEnv(key)
	if !exists {
		log.Fatalf("Environment variable %s is required but not set", key)
	}
	return value
}

// mustGetEnvAsInt retrieves the value of the given environment variable,
// converts it to an integer, or exits with a fatal error if the variable
// is not set or cannot be converted to an integer.
func mustGetEnvAsInt(key string) int {
	valueStr := mustGetEnv(key)
	value, err := strconv.Atoi(valueStr)
	if err != nil {
		log.Fatalf("Environment variable %s must be a valid integer: %v", key, err)
	}
	return value
}

func mustGetEnvAsStringSlice(key string) []string {
	value, exists := os.LookupEnv(key)
	if !exists {
		log.Fatalf("Environment variable %s is required but not set", key)
	}

	return strings.Split(value, ",")
}
