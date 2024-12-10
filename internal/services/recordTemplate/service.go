package recordtemplate

import "github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/storage/mongo"

type RecordTemplateService struct {
	dbClient *mongo.MongoClient
}

func NewRecordTemplateService(dbClient *mongo.MongoClient) RecordTemplateService {
	return RecordTemplateService{dbClient}
}