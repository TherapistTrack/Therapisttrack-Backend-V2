package mongo

import "go.mongodb.org/mongo-driver/bson/primitive"

type UserModel struct {
	Id                primitive.ObjectID `bson:"_id"`
	Names             string             `bson:"names"`
	LastNames         string             `bson:"lastNames"`
	Mails             []string           `bson:"mails"`
	Phones            []string           `bson:"phones"`
	Role              []string           `bson:"role"`
	RoleDependentInfo primitive.ObjectID `bson:"roleDependentInfo"`
}

type DoctorModel struct {
	Id               primitive.ObjectID `bson:"_id"`
	User             primitive.ObjectID `bson:"user"`
	Specialty        string             `bson:"specialty"`
	CollegiateNumber string             `bson:"collegiateNumber"`
}

type AssistantModel struct {
	Id        primitive.ObjectID `bson:"_id"`
	StartDate primitive.DateTime `bson:"startDate"`
	EndDate   primitive.DateTime `bson:"endDate"`
	DPI       string             `bson:"DPI"`
}
