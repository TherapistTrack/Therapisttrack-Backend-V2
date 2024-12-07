package user

import (
	"context"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services"
)

// HealthHandler handles the /health endpoint.
func (s *UserService) CreateUser(ctx context.Context, user *services.User, roleDependentInfo *services.RoleDependentInfo) error {

	// coll := s.dbClient.DB.Collection("")

	// coll.InsertOne(ctx, {})

	return nil
}
