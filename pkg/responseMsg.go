package pkg

type ResponseMsg = string

const (
	// 200: Success
	RequestSuccess ResponseMsg = "Request successful."

	// 400: Missing data on request
	MissingFields       ResponseMsg = "Missing Fields."
	ReservedFieldNames  ResponseMsg = "Names as 'Apellidos' and 'Nombres' are reserved."
	DuplicateFieldNames ResponseMsg = "Field names must be unique."
	InvalidDoctorID     ResponseMsg = "doctorId is invalid."
	InvalidFileID       ResponseMsg = "fileId is invalid."
	InvalidRecordID     ResponseMsg = "recordId is invalid."

	// 403: Not authorized
	DoctorIsNotOwner ResponseMsg = "Doctor is not the owner of template."

	// 404: Resource not found
	DoctorNotFound          ResponseMsg = "Doctor not found."
	TemplateNotFound        ResponseMsg = "Template not found."
	FieldNotFound           ResponseMsg = "Field not found."
	RecordNotFound          ResponseMsg = "Record not found."
	FileNotFound            ResponseMsg = "File not found."
	MissingFieldsInTemplate ResponseMsg = "Missing required fields defined by the template."

	// 405: Invalid field types
	InvalidType               ResponseMsg = "Specified type does not exist."
	InvalidFieldTypeText      ResponseMsg = "Invalid value for TEXT field."
	InvalidFieldTypeShortText ResponseMsg = "Invalid value for SHORT_TEXT field."
	InvalidFieldTypeNumber    ResponseMsg = "Invalid value for NUMBER field."
	InvalidFieldTypeFloat     ResponseMsg = "Invalid value for FLOAT field."
	InvalidFieldTypeChoice    ResponseMsg = "Invalid value for CHOICE field."
	InvalidFieldTypeDate      ResponseMsg = "Invalid value for DATE field."

	// 406: Resource already in use
	ResourceWithNameAlreadyExist ResponseMsg = "Item with that id/name already exists."

	// 409: Resources depend on this resource
	OperationRejected ResponseMsg = "Could not modify item since other resources depend on it."
)
