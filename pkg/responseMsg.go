package pkg

// Implement error interface
type ResponseMsg struct {
	Message    string
	StatusCode int
}

func (e *ResponseMsg) Error() string {
	return e.Message
}

func NewServiceError(message string, statusCode int) *ResponseMsg {
	return &ResponseMsg{
		Message:    message,
		StatusCode: statusCode,
	}
}

// Initialize the ResponseMsg instances with correct values.
var (
	// 200: Success
	RequestSuccess = &ResponseMsg{"Request successful.", 200}

	// 400: Missing data on request
	MissingFields       = &ResponseMsg{"Missing Fields or invalid data.", 400}
	ReservedFieldNames  = &ResponseMsg{"Names as 'Apellidos' and 'Nombres' are reserved.", 400}
	DateNotPrevious     = &ResponseMsg{"startDate should occur before endDate", 400}
	DuplicateFieldNames = &ResponseMsg{"Field names must be unique.", 400}
	InvalidDoctorID     = &ResponseMsg{"doctorId is invalid.", 400}
	InvalidFileID       = &ResponseMsg{"fileId is invalid.", 400}
	InvalidRecordID     = &ResponseMsg{"recordId is invalid.", 400}

	// 403: Not authorized
	DoctorIsNotOwner = &ResponseMsg{"Doctor is not the owner of the template.", 403}

	// 404: Resource not found
	UserNotFound            = &ResponseMsg{"User not found.", 404}
	DoctorNotFound          = &ResponseMsg{"Doctor not found.", 404}
	TemplateNotFound        = &ResponseMsg{"Template not found.", 404}
	FieldNotFound           = &ResponseMsg{"Field not found.", 404}
	RecordNotFound          = &ResponseMsg{"Record not found.", 404}
	FileNotFound            = &ResponseMsg{"File not found.", 404}
	MissingFieldsInTemplate = &ResponseMsg{"Missing required fields defined by the template.", 404}

	// 405: Invalid field types
	InvalidType               = &ResponseMsg{"Specified type does not exist.", 405}
	InvalidFieldTypeText      = &ResponseMsg{"Invalid value for TEXT field.", 405}
	InvalidFieldTypeShortText = &ResponseMsg{"Invalid value for SHORT_TEXT field.", 405}
	InvalidFieldTypeNumber    = &ResponseMsg{"Invalid value for NUMBER field.", 405}
	InvalidFieldTypeFloat     = &ResponseMsg{"Invalid value for FLOAT field.", 405}
	InvalidFieldTypeChoice    = &ResponseMsg{"Invalid value for CHOICE field.", 405}
	InvalidFieldTypeDate      = &ResponseMsg{"Invalid value for DATE field.", 405}

	// 406: Resource already in use
	ResourceWithNameAlreadyExist = &ResponseMsg{"Item with that id/name already exists.", 406}

	// 409: Resources depend on this resource
	OperationRejected = &ResponseMsg{"Could not modify item since other resources depend on it.", 409}

	// 500: Internal Server Error
	BadDatabaseOperation = &ResponseMsg{"Failed to execute DB operations.", 500}
)
