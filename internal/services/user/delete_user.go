package user

import (
	"context"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/pkg"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// TODO: define protocol to delete user data permantly.
// TODO: You should not be able to inactivate yourself.
func (s *UserService) DeleteUser(ctx context.Context, userId primitive.ObjectID) error {
	coll := s.dbClient.DB.Collection("User")

	result, err := coll.UpdateOne(ctx,
		bson.M{"_id": userId},
		bson.M{"$set": bson.M{"isActive": false}})

	if err != nil {
		log.Debug().Msg("Database error!")
		return pkg.BadDatabaseOperation
	}

	if result.MatchedCount == 0 {
		log.Debug().Msg("User to delete not found...")
		return pkg.UserNotFound
	}

	return nil
}
