package user

import (
	"encoding/json"
	"fmt"
	"net/http"

	md "github.com/TherapistTrack/Therapisttrack-Backend-V2/api/middlewares"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services/user"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/pkg"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type deleteUserRequest struct {
	Id string `json:"id" validate:"required"`
}

type deleteUserResponse struct {
	Message string `json:"message"`
}

func NewDeleteUserHandler(s *user.UserService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		failedJSONValidation := ""

		var data deleteUserRequest

		if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
			failedJSONValidation = "Request fields mismatch types"
		}

		if err := s.Validator.Struct(data); err != nil {
			failedJSONValidation = "Request Missing fields, Id not sent"
		}

		userId, err := primitive.ObjectIDFromHex(data.Id)
		if err != nil {
			failedJSONValidation = "Not valid MongoID format"
		}

		if len(failedJSONValidation) > 0 {
			body, _ := json.Marshal(data)
			md.LogErrorRequest(fmt.Errorf(failedJSONValidation), r, pkg.MissingFields.StatusCode, &body)
			http.Error(w, fmt.Sprintf(`{"message": "%s"}`, pkg.MissingFields.Message), pkg.MissingFields.StatusCode)
			return
		}

		log.Debug().Msg("Deleting user... Setting isActive false")
		err = s.DeleteUser(r.Context(), userId)
		if err != nil {
			body, _ := json.Marshal(data)
			serviceError := err.(*pkg.ResponseMsg)
			md.LogErrorRequest(serviceError, r, serviceError.StatusCode, &body)
			http.Error(w, fmt.Sprintf(`{"message": "%s"}`, serviceError.Message), serviceError.StatusCode)
			return
		}

		// Respond with success
		w.WriteHeader(pkg.RequestSuccess.StatusCode)
		json.NewEncoder(w).Encode(deleteUserResponse{
			Message: pkg.RequestSuccess.Message})
	}
}
