package pkg

/*
This file may contains small utility and generic function that could be used all around the program.
*/

import "time"

func IsValidISO8601(dateStr string) bool {
	// List of common ISO8601 formats to check
	formats := []string{
		time.RFC3339,          // "2006-01-02T15:04:05Z07:00"
		"2006-01-02",          // Date only
		"2006-01-02T15:04:05", // Without timezone
		"2006-01-02T15:04",    // Without seconds
		"2006-01-02 15:04:05", // Space separator, without timezone
		"2006-01-02 15:04",    // Space separator, without seconds
	}

	for _, format := range formats {
		if _, err := time.Parse(format, dateStr); err == nil {
			return true
		}
	}

	return false
}
