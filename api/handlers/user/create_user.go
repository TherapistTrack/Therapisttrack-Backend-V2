package user

import (
	"encoding/json"
	"net/http"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services/user"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/pkg"
)

type createUserRequest struct {
	Names             string   `json:"names"`
	LastNames         string   `json:"lastNames"`
	Phones            []string `json:"phones"`
	Mails             []string `json:"mails"`
	Role              string   `json:"rol"`
	RoleDependentInfo struct {
		CollegiateNumber string `json:"collegiateNumber,omitempty"`
		Specialty        string `json:"specialty,omitempty"`
		StartDate        string `json:"startDate,omitempty"`
		EndDate          string `json:"endDate,omitempty"`
		DPI              string `json:"DPI,omitempty"`
	}
}

// NewCreateUserHandler handles the /user endpoint.
func NewCreateUserHandler(s *user.UserService) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {
		// Set response headers
		w.Header().Set("Content-Type", "application/json")

		// Decode the request body into createUserRequest
		var req createUserRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error": "Invalid JSON format"}`, http.StatusBadRequest)
			return
		}

		// Respond with success
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": pkg.RequestSuccess})
	}

}
