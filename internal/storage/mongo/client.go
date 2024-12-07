package mongo

import (
	"context"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/config"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoClient struct {
	client *mongo.Client
	DB     *mongo.Database
}

func NewMongoClient(config *config.DatabaseConfig) (*MongoClient, error) {

	// Build the connection URI
	uri := fmt.Sprintf("mongodb://%s:%s@%s:%s/%s", config.DBUser, config.DBPassword, config.DBHost, config.DBPort, config.DBName)
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().
		ApplyURI(uri).
		SetServerAPIOptions(serverAPI).
		SetBSONOptions(&options.BSONOptions{
			NilSliceAsEmpty: true,
		})

	// Set a timeout for the connection
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.Debug().Msg("API options created")

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %v", err)
	}

	log.Debug().Msg("Connection to DB succesfull")

	// Ping the MongoDB server to verify connection
	db := client.Database(config.DBName)
	if err := db.RunCommand(ctx, bson.D{{"ping", 1}}).Err(); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %v", err)
	}

	log.Debug().Msg("Could create Mongo Client")

	return &MongoClient{
		client: client,
		DB:     db,
	}, nil
}

func (c *MongoClient) Close() {
	if err := c.client.Disconnect(context.TODO()); err != nil {
		log.Fatal().Str("error", fmt.Sprintf("Failed to disconnect MongoDB client: %v\n", err))
	}
}
