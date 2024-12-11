package record

import "github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/storage/mongo_cli"

type RecordService struct {
	dbClient *mongo_cli.MongoClient
}

func newRecordService(client *mongo_cli.MongoClient) RecordService {
	return RecordService{
		dbClient: client,
	}
}
