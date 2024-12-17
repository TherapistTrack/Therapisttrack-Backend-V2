package mongo_cli

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserModel struct {
	Id                primitive.ObjectID `bson:"_id,omitempty"`
	Names             string             `bson:"names"`
	LastNames         string             `bson:"lastNames"`
	Mails             []string           `bson:"mails"`
	Phones            []string           `bson:"phones"`
	Role              string             `bson:"rol"`
	RoleDependentInfo primitive.ObjectID `bson:"roleDependentInfo"`
	IsActive          bool               `bson:"isActive"`
}

type DoctorModel struct {
	Id               primitive.ObjectID `bson:"_id,omitempty"`
	User             primitive.ObjectID `bson:"user"`
	Specialty        string             `bson:"specialty"`
	CollegiateNumber string             `bson:"collegiateNumber"`
}

type AssistantModel struct {
	Id        primitive.ObjectID `bson:"_id"`
	User      primitive.ObjectID `bson:"user"`
	StartDate primitive.DateTime `bson:"startDate"`
	EndDate   primitive.DateTime `bson:"endDate"`
	DPI       string             `bson:"DPI"`
}

type PatientTemplate struct {
	Id 				primitive.ObjectID 	`bson:"_id"`
	Doctor 			string			 	`bson:"doctor"`
	Name 			string 				`bson:"name"`
	Categories		[]string			`bson:"categories"`
	LastUpdate		primitive.DateTime 	`bson:"lastUpdate"`
	Fields			[]PatientFields		`bson:"fiels"`
}

type PatientFields struct {
	Name			string		`bson:"name"`
	Type			string		`bson:"type"`
	Options 		[]string	`bson:"options"`
	Description 	string		`bson:"description"`
}
