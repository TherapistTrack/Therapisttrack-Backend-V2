package user

import "github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/storage/mongo"

type UserService struct {
	dbClient *mongo.MongoClient
}

func NewUserService(dbClient *mongo.MongoClient) UserService {
	return UserService{dbClient}
}
