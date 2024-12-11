package user

import (
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/storage/mongo_cli"
	"github.com/go-playground/validator/v10"
)

type UserService struct {
	dbClient  *mongo_cli.MongoClient
	Validator *validator.Validate
}

func NewUserService(dbClient *mongo_cli.MongoClient, validator *validator.Validate) UserService {
	return UserService{dbClient, validator}
}
