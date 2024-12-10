package user

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services/user"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/pkg"
	"github.com/rs/zerolog/log"
)

// NewCreateUserHandler handles the /user endpoint.
func NewCreateUserHandler(s *user.UserService) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		failedValidation := false

		// Decode the request body into createUserRequest
		var data services.User
		// Validate correct types
		if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
			failedValidation = true
		}

		// Validate all fields sent
		if err := s.Validator.Struct(data); err != nil {
			failedValidation = true
		}

		// Validating Role Dependent Info based on the Role field.
		switch roleInfo := data.RoleDependentInfo; data.Role {
		case "Doctor":
			if roleInfo.CollegiateNumber == "" || data.RoleDependentInfo.Specialty == "" {
				failedValidation = true
			}
		case "Assistant":
			if len(roleInfo.DPI) != 13 ||
				!pkg.IsValidISO8601(roleInfo.StartDate) ||
				!pkg.IsValidISO8601(roleInfo.EndDate) {
				failedValidation = true
			}
		}

		if failedValidation {
			http.Error(w, fmt.Sprintf(`{"message": "%s"}`, pkg.MissingFields), http.StatusBadRequest)
			return
		}

		// Create User
		userId, roleId, err := s.CreateDoctor(r.Context(), &data)
		if err != nil {
			log.Debug().Msg(err.Error())
			http.Error(w, fmt.Sprintf(`{"message": "%s"}`, pkg.MissingFields), http.StatusBadRequest)
			return
		}

		// Respond with success
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{
			"message": pkg.RequestSuccess,
			"userId":  userId,
			"roleId":  roleId})
	}

}
