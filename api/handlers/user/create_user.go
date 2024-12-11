package user

import (
	"encoding/json"
	"fmt"
	"net/http"

	md "github.com/TherapistTrack/Therapisttrack-Backend-V2/api/middlewares"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services/user"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/pkg"
	"github.com/rs/zerolog/log"
)

type createUserRequest struct {
	Id                string   `json:"id" validate:"required"`
	Names             string   `json:"names" validate:"required"`
	LastNames         string   `json:"lastNames" validate:"required"`
	Phones            []string `json:"phones" validate:"required"`
	Mails             []string `json:"mails" validate:"required"`
	Role              string   `json:"rol" validate:"required,oneof=Doctor Assistant Admin"`
	RoleDependentInfo struct {
		CollegiateNumber string `json:"collegiateNumber,omitempty"`
		Specialty        string `json:"specialty,omitempty"`
		StartDate        string `json:"startDate,omitempty"`
		EndDate          string `json:"endDate,omitempty"`
		DPI              string `json:"DPI,omitempty" validate:"omitempty,numeric"`
	}
}

type createUserResponse struct {
	Message string `json:"message"`
	UserId  string `json:"userId"`
	RoleId  string `json:"roleId"`
}

// NewCreateUserHandler handles the /user endpoint.
func NewCreateUserHandler(s *user.UserService) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		failedJSONValidation := ""

		var data createUserRequest

		if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
			failedJSONValidation = "Request fields mismatch types"
		}

		if err := s.Validator.Struct(data); err != nil {
			failedJSONValidation = "Request Missing fields, not all fields sent"
		}

		// Validating Role Dependent Info based on the Role field.
		switch roleInfo := data.RoleDependentInfo; data.Role {
		case "Doctor":
			if roleInfo.CollegiateNumber == "" || data.RoleDependentInfo.Specialty == "" {
				failedJSONValidation = "Collegiate Number or Specialty must not be empty"
			}
		case "Assistant":
			if len(roleInfo.DPI) != 13 ||
				!pkg.IsValidISO8601(roleInfo.StartDate) ||
				!pkg.IsValidISO8601(roleInfo.EndDate) {
				failedJSONValidation = "Date is not in ISO8601 Format"
			}
		}

		if len(failedJSONValidation) > 0 {
			body, _ := json.Marshal(data)
			md.LogErrorRequest(fmt.Errorf(failedJSONValidation), r, pkg.MissingFields.StatusCode, &body)
			http.Error(w, fmt.Sprintf(`{"message": "%s"}`, pkg.MissingFields.Message), pkg.MissingFields.StatusCode)
			return
		}

		log.Debug().Msg("Creating User...")

		user := services.User{
			Id:        data.Id,
			Names:     data.Names,
			LastNames: data.LastNames,
			Phones:    data.Phones,
			Mails:     data.Mails,
			Role:      data.Role,
			RoleDependentInfo: services.RoleDependentInfo{
				CollegiateNumber: data.RoleDependentInfo.CollegiateNumber,
				Specialty:        data.RoleDependentInfo.Specialty,
				StartDate:        data.RoleDependentInfo.StartDate,
				EndDate:          data.RoleDependentInfo.EndDate,
				DPI:              data.RoleDependentInfo.DPI}}

		userId, roleId, err := s.CreateUser(r.Context(), &user)
		if err != nil {
			body, _ := json.Marshal(data)
			serviceError := err.(*pkg.ResponseMsg)
			md.LogErrorRequest(err, r, http.StatusBadRequest, &body)
			http.Error(w, fmt.Sprintf(`{"message": "%s"}`, serviceError.Message), serviceError.StatusCode)
			return
		}

		// Respond with success
		w.WriteHeader(pkg.RequestSuccess.StatusCode)
		json.NewEncoder(w).Encode(createUserResponse{
			Message: pkg.RequestSuccess.Message,
			UserId:  userId,
			RoleId:  roleId})
	}

}
