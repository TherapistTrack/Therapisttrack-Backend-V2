package recordtemplate

import (
	"fmt"

	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/pkg"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (s *RecordTemplateService) createRecordTemplate(recordTemplate *services.PatientTemplate) error {
	coll := s.dbClient.DB.Collection("PatientTemplate")

	if recordTemplate.Doctor == "" || recordTemplate.Name == "" || recordTemplate.Categories == nil || recordTemplate.Fields == nil {
		return fmt.Errorf(pkg.MissingFields)
	}

	if len(recordTemplate.Categories) == 0 || len(recordTemplate.Fields) == 0 {
		return fmt.Errorf(pkg.MissingFields)	  
	}

	fieldNames := make(map[string]bool)
	for _, field := range recordTemplate.Fields {
		if fieldNames[field.Name] {
			return fmt.Errorf(pkg.DuplicateFieldNames)
		}
		fieldNames[field.Name] = true

		reservedNames := map[string]bool{
			"id": true,
			"name": true,
		}

		if reservedNames[field.Name] {
			return fmt.Errorf(pkg.ReservedFieldNames)
		}

		if field.Type == "CHOICE" && (field.Options == nil || len(field.Options) == 0){
			return fmt.Errorf(pkg.MissingFields)
		}
	}

	existingObject := coll.FindOne(recordTemplate.Name)

	if existingObject != nil {
		return fmt.Errorf(pkg.ResourceWithNameAlreadyExist)
	}

	if !primitive.IsValidObjectID(recordTemplate.Doctor) {
		return fmt.Errorf(pkg.DoctorNotFound)
	}

	coll.Aggregate(recordTemplate)

	return nil
}