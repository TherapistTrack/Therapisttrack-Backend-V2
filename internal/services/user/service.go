package user

import (
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/storage/mongo"
	"github.com/go-playground/validator/v10"
)

type UserService struct {
	dbClient  *mongo.MongoClient
	Validator *validator.Validate
}

func NewUserService(dbClient *mongo.MongoClient, validator *validator.Validate) UserService {
	return UserService{dbClient, validator}
}
