const COMMON_MSG = {
  // 200: Success
  REQUEST_SUCCESS: 'Request successful.',
  // 400: Missing data on request
  MISSING_FIELDS: 'Missing Fields.',
  RESERVED_FIELD_NAMES: 'Names as Apellidos and Nombres are reserved',
  DUPLICATE_FIELD_NAMES: 'Field names must be unique',
  INVALID_DOCTOR_ID: 'doctorId is invalid',
  INVALID_FILE_ID: 'fileId is invalid',
  INVALID_RECORD_ID: 'recordId is invalid',
  // 403: Not authorized
  DOCTOR_IS_NOT_OWNER: 'Doctor is not the owner of template.',
  // 404: Resource not found
  DOCTOR_NOT_FOUND: 'Doctor not found.',
  TEMPLATE_NOT_FOUND: 'Template not found.',
  FIELD_NOT_FOUND: 'Field not found.',
  RECORD_NOT_FOUND: 'Record not found.',
  FILE_NOT_FOUND: 'File not found.',
  MISSING_FIELDS_IN_TEMPLATE:
    'Missing required fields defined by the template.',
  // 405: Invalid field types
  INVALID_TYPE: 'Specified type does not exist.',
  INVALID_FIELD_TYPE_TEXT: 'Invalid value for TEXT field.',
  INVALID_FIELD_TYPE_SHORT_TEXT: 'Invalid value for SHORT_TEXT field.',
  INVALID_FIELD_TYPE_NUMBER: 'Invalid value for NUMBER field.',
  INVALID_FIELD_TYPE_FLOAT: 'Invalid value for FLOAT field.',
  INVALID_FIELD_TYPE_CHOICE: 'Invalid value for CHOICE field.',
  INVALID_FIELD_TYPE_DATE: 'Invalid value for DATE field.',
  // 406: Resource already in use
  RECORDS_USING: 'Item with that id/name already exists',
  // 409: Resources depend on this resource
  OPERATION_REJECTED: 'Could not modify item since other resources depend on it'
}

module.exports = COMMON_MSG
