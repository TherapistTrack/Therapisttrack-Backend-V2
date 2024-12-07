package record

import (
	"net/http"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services/user"
)

// NewCreateUserHandler handles the /user endpoint.
func NewCreateUserHandler(s *user.UserService) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {

	}

}
