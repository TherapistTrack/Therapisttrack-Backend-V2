package api

import (
	"net/http"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/api/handlers/health"
	userHandlers "github.com/TherapistTrack/Therapisttrack-Backend-V2/api/handlers/user"
	userServ "github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services/user"
)

type Api struct {
	// Dependencies
	userService *userServ.UserService

	// Handlers
	CheckHealthHandler http.HandlerFunc

	CreateUserHandler http.HandlerFunc
}

func NewApi(
	userService *userServ.UserService,
) *Api {

	if userService == nil {
		panic("userService not initialized")
	}

	return &Api{
		userService: userService,

		CheckHealthHandler: health.CheckHealthHandler,
		CreateUserHandler:  userHandlers.NewCreateUserHandler(userService),
	}
}
