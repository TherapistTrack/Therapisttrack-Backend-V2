package user

import (
	"encoding/json"
	"net/http"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services/user"
)

// NewCreateUserHandler handles the /user endpoint.
func NewCreateUserHandler(userService *user.UserService) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {

		w.Header().Set("Content-Type", "application/json")

		// Define the response dynamically
		response := map[string]interface{}{
			"message": "User created successfully",
			"user": map[string]interface{}{
				"id":    1,
				"names": "John",
				"roles": []string{"admin", "editor"},
			},
		}

		// Write the JSON response to the client
		if err := json.NewEncoder(w).Encode(response); err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}

	}
}
