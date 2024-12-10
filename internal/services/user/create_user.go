package user

import (
	"context"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/storage/mongo"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (s *UserService) CreateDoctor(ctx context.Context, user *services.User) (string, string, error) {
	// Collections
	userColl := s.dbClient.DB.Collection("User")
	doctorColl := s.dbClient.DB.Collection("Doctor")

	// Insert user into the User collection
	dbUser := mongo.UserModel{
		Names:     user.Names,
		LastNames: user.LastNames,
		Phones:    user.Phones,
		Mails:     user.Mails,
		Role:      "Doctor",
		IsActive:  true,
	}

	userResult, err := userColl.InsertOne(ctx, dbUser)
	if err != nil {
		return "", "", err
	}

	// Insert the doctor data into the Doctor collection
	dbRole := mongo.DoctorModel{
		User:             userResult.InsertedID.(primitive.ObjectID),
		CollegiateNumber: user.RoleDependentInfo.CollegiateNumber,
		Specialty:        user.RoleDependentInfo.Specialty,
	}

	roleResult, err := doctorColl.InsertOne(ctx, dbRole)
	if err != nil {
		return "", "", err
	}

	log.Debug().Msg("So good so far")

	// Update the User collection with the Doctor's ID
	_, err = userColl.UpdateOne(ctx,
		bson.M{"_id": userResult.InsertedID.(primitive.ObjectID)},
		bson.M{"$set": bson.M{"roleDependentInfo": roleResult.InsertedID.(primitive.ObjectID)}})
	if err != nil {
		return "", "", err
	}

	log.Debug().Msg(roleResult.InsertedID.(primitive.ObjectID).String())

	// Return the inserted IDs
	return userResult.InsertedID.(primitive.ObjectID).Hex(),
		roleResult.InsertedID.(primitive.ObjectID).Hex(),
		nil
}
