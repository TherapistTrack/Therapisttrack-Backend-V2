package api

import (
	"net/http"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/api/handlers/health"
	userHandlers "github.com/TherapistTrack/Therapisttrack-Backend-V2/api/handlers/user"
	userServ "github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services/user"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/storage/mongo"
	"github.com/go-playground/validator/v10"
)

type Api struct {
	mongoClient *mongo.MongoClient

	// Dependencies
	userService *userServ.UserService

	// Handlers: endpoint functions
	CheckHealthHandler http.HandlerFunc

	CreateUserHandler http.HandlerFunc
}

func NewApi(
	mongoClient *mongo.MongoClient,
) *Api {

	validate := validator.New(validator.WithRequiredStructEnabled())

	userService := userServ.NewUserService(mongoClient, validate)

	return &Api{
		mongoClient: mongoClient,
		userService: &userService,

		CheckHealthHandler: health.CheckHealthHandler,

		CreateUserHandler: userHandlers.NewCreateUserHandler(&userService),
	}
}
