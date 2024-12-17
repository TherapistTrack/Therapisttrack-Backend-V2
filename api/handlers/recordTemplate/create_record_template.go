package recordtemplate

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	md "github.com/TherapistTrack/Therapisttrack-Backend-V2/api/middlewares"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services"
	recordtemplate "github.com/TherapistTrack/Therapisttrack-Backend-V2/internal/services/recordTemplate"
	"github.com/TherapistTrack/Therapisttrack-Backend-V2/pkg"
	"github.com/rs/zerolog/log"
)

type fieldsRecordTemplateRequest struct {
	Name        string   `json:"name" validate:"required"`
	Type        string   `json:"type" validate:"required"`
	Options     []string `json:"options"`
	Description string   `json:"description"`
}

type createRecordTemplateRequest struct {
	DoctorId   string                        `json:"doctorId" validate:"required"`
	Name       string                        `json:"name" validate:"required"`
	Categories []string                      `json:"categories" validate:"required"`
	Fields     []fieldsRecordTemplateRequest `json:"fields" validate:"required"`
}

type createRecordTemplateResponse struct {
	Message           string `json:"message"`
	DoctorId          string `json:"doctorId"`
	PatientTemplateId string `json:"patientTemplateId"`
}

func NewCreateRecordTemplateHandler(s *recordtemplate.RecordTemplateService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		failedJSONValidation := ""
		failedJSONValidationCode := 0

		var data createRecordTemplateRequest

		if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
			failedJSONValidation = "Request fields mismatch types"
		}

		if err := s.Validator.Struct(data); err != nil {
			failedJSONValidation = "Request Missing fields, not all fields sent"
		}

		fieldNames := make(map[string]bool)
		for _, field := range data.Fields {
			if fieldNames[field.Name] {
				failedJSONValidation = pkg.DuplicateFieldNames.Message
				failedJSONValidationCode = pkg.DuplicateFieldNames.StatusCode
			}
			fieldNames[field.Name] = true
	
			reservedNames := map[string]bool{
				"id": true,
				"name": true,
			}
	
			if reservedNames[field.Name] {
				failedJSONValidation = pkg.ReservedFieldNames.Message
				failedJSONValidationCode = pkg.ReservedFieldNames.StatusCode
			}
	
			if field.Type == "CHOICE" && (field.Options == nil || len(field.Options) == 0){
				failedJSONValidation = pkg.MissingFields.Message
				failedJSONValidationCode = pkg.MissingFields.StatusCode
			}
		}

		if len(failedJSONValidation) > 0 && failedJSONValidationCode != 0 {
			body, _ := json.Marshal(data)
			md.LogErrorRequest(fmt.Errorf(failedJSONValidation), r, failedJSONValidationCode, &body)
			http.Error(w, fmt.Sprintf(`{"message": "%s"}`, failedJSONValidation), failedJSONValidationCode)
			return
		}

		log.Debug().Msg("Creating Record Template...")

		fields := make([]services.PatientFields, len(data.Fields))

		for i, field := range data.Fields {
			fields[i] = services.PatientFields{
				Name: field.Name,
				Type: field.Type,
				Options: field.Options,
				Description: field.Description,
			}
		}

		recordTemplate := services.PatientTemplate {
			Doctor: data.DoctorId,
			Name: data.Name,
			Categories: data.Categories,
			LastUpdate: time.Now(),
			Fields: fields,
		}

		doctorId, patientTemplateId, err := s.CreateRecordTemplate(r.Context(), &recordTemplate)

		if err != nil {
			body, _ := json.Marshal(data)
			servicesError := err.(*pkg.ResponseMsg)
			md.LogErrorRequest(err, r, http.StatusBadRequest, &body)
			http.Error(w, fmt.Sprintf(`{"message": "%s"}`, servicesError.Message), servicesError.StatusCode)
			return
		}

		w.WriteHeader(pkg.RequestSuccess.StatusCode)
		json.NewEncoder(w).Encode(createRecordTemplateResponse{
			Message: pkg.RequestSuccess.Message,
			DoctorId: doctorId,
			PatientTemplateId: patientTemplateId,
		})

	}
}