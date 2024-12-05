package config

import (
	"log"
	"os"
	"strconv"
)

type Config struct {
	AppName    string
	Port       int
	DBUser     string
	DBPassword string
	DBHost     string
	DBName     string
	AuthSecret string
}

// LoadConfig loads configuration from environment variables.
// It exits with a fatal error if any required variable is missing.
func LoadConfig() Config {
	return Config{
		AppName:    mustGetEnv("APP_NAME"),
		Port:       mustGetEnvAsInt("APP_PORT"),
		DBUser:     mustGetEnv("DB_USER"),
		DBPassword: mustGetEnv("DB_PASSWORD"),
		DBHost:     mustGetEnv("DB_HOST"),
		DBName:     mustGetEnv("DB_NAME"),
		AuthSecret: mustGetEnv("AUTH_SECRET"),
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
