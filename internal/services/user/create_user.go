package user

import (
	"context"
	"time"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/storage/mongo_cli"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/pkg"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func (s *UserService) CreateUser(ctx context.Context, user *services.User) (string, string, error) {
	// Collections
	userColl := s.dbClient.DB.Collection("User")

	dbUser := mongo_cli.UserModel{
		Names:     user.Names,
		LastNames: user.LastNames,
		Phones:    user.Phones,
		Mails:     user.Mails,
		Role:      user.Role,
		IsActive:  true,
	}

	log.Debug().Msg("Insert User on DB")
	userResult, err := userColl.InsertOne(ctx, dbUser)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return "", "", pkg.ResourceWithNameAlreadyExist
		}
		return "", "", pkg.BadDatabaseOperation
	}

	log.Debug().Msg("Create Role Dependent Info")
	userId := userResult.InsertedID.(primitive.ObjectID)
	var roleResult *mongo.InsertOneResult
	switch user.Role {
	case "Admin":
		return userId.Hex(), "", nil // If role Admin, NO need to create more, so just return
	case "Doctor":
		roleResult, err = createDoctor(ctx, s.dbClient, user, userId)
		if err != nil {
			return "", "", err
		}
	case "Assistant":
		roleResult, err = createDoctor(ctx, s.dbClient, user, userId)
		if err != nil {
			return "", "", err
		}
	}

	log.Debug().Msg("Update the User collection with the Docto's ID")
	_, err = userColl.UpdateOne(ctx,
		bson.M{"_id": userResult.InsertedID.(primitive.ObjectID)},
		bson.M{"$set": bson.M{"roleDependentInfo": roleResult.InsertedID.(primitive.ObjectID)}})
	if err != nil {
		return "", "", err
	}

	return userResult.InsertedID.(primitive.ObjectID).Hex(),
		roleResult.InsertedID.(primitive.ObjectID).Hex(),
		nil
}

func createDoctor(ctx context.Context, dbClient *mongo_cli.MongoClient, user *services.User, userId primitive.ObjectID) (*mongo.InsertOneResult, error) {
	doctorColl := dbClient.DB.Collection("Doctor")

	dbRole := mongo_cli.DoctorModel{
		User:             userId,
		CollegiateNumber: user.RoleDependentInfo.CollegiateNumber,
		Specialty:        user.RoleDependentInfo.Specialty,
	}

	roleResult, err := doctorColl.InsertOne(ctx, dbRole)
	if err != nil {
		return nil, pkg.BadDatabaseOperation
	}
	return roleResult, nil
}

func createAssistant(ctx context.Context, dbClient *mongo_cli.MongoClient, user *services.User, userId primitive.ObjectID) (*mongo.InsertOneResult, error) {
	assistantColl := dbClient.DB.Collection("Assistant")

	// Convert ISO8601 strings to time.Time and then to primitive.DateTime
	startDate, _ := time.Parse(time.RFC3339, user.RoleDependentInfo.StartDate)
	endDate, _ := time.Parse(time.RFC3339, user.RoleDependentInfo.EndDate)

	if startDate.Before(endDate) {
		return nil, pkg.DateNotPrevious
	}

	dbRole := mongo_cli.AssistantModel{
		User:      userId,
		StartDate: primitive.NewDateTimeFromTime(startDate),
		EndDate:   primitive.NewDateTimeFromTime(endDate),
		DPI:       user.RoleDependentInfo.DPI,
	}

	roleResult, err := assistantColl.InsertOne(ctx, dbRole)
	if err != nil {
		return nil, pkg.BadDatabaseOperation
	}
	return roleResult, nil
}
