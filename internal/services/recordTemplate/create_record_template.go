package recordtemplate

import (
	"context"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/storage/mongo_cli"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/pkg"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func (s *RecordTemplateService) CreateRecordTemplate(ctx context.Context, recordTemplate *services.PatientTemplate) (string, string, error) {
	coll := s.dbClient.DB.Collection("PatientTemplate")


	fields := make([]mongo_cli.PatientFields, len(recordTemplate.Fields))

	for i, field := range recordTemplate.Fields {
		fields[i] = mongo_cli.PatientFields{
			Name: field.Name,
			Type: field.Type,
			Options: field.Options,
			Description: field.Description,
		}
	}

	dbRecordTemplate := mongo_cli.PatientTemplate{
		Doctor: recordTemplate.Doctor,
		Name: recordTemplate.Name,
		Categories: recordTemplate.Categories,
		Fields: fields	,
	}

	existingObject := coll.FindOne(ctx, recordTemplate.Name)

	if existingObject != nil {
		return "", "", pkg.ResourceWithNameAlreadyExist
	}

	if !primitive.IsValidObjectID(recordTemplate.Doctor) {
		return "", "", pkg.DoctorNotFound
	}

	log.Debug().Msg("Insert User on DB")

	recordTemplateResult, err := coll.InsertOne(ctx, dbRecordTemplate)

	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return "", "", pkg.ResourceWithNameAlreadyExist
		}
		return "", "", pkg.BadDatabaseOperation
	}

	return recordTemplate.Doctor, recordTemplateResult.InsertedID.(primitive.ObjectID).Hex(), nil
}