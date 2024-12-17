package recordtemplate

import (
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/storage/mongo_cli"
	"github.com/go-playground/validator/v10"
)

type RecordTemplateService struct {
	dbClient *mongo_cli.MongoClient
	Validator *validator.Validate
}

func NewRecordTemplateService(dbClient *mongo_cli.MongoClient, validator *validator.Validate) RecordTemplateService {
	return RecordTemplateService{dbClient, validator}
}