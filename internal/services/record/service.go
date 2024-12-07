package record

import "github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/storage/mongo"

type RecordService struct {
	dbClient *mongo.MongoClient
}

func newRecordService(client *mongo.MongoClient) RecordService {
	return RecordService{
		dbClient: client,
	}
}
