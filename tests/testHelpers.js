const axios = require('axios')
const { BASE_URL, getAuthToken } = require('./jest.setup')
const fs = require('fs') // Import the 'fs' module
const path = require('path') // Import the 'path' module
const FormData = require('form-data') // Import 'form-data' module

// OTHER EXPRESIONS
const iso8601Regex =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?)?$/

/**
 * Makes a request using the specified axios method, and checks if it fails with the expected status and message.
 *
 * @param {string} axiosMethod - The axios method to use (e.g., axios.post, axios.get).
 * @param {string} url - The API endpoint URL to send the request to.
 * @param {headers} [body] - Request headers
 * @param {Object} [params={}] - An object representing query parameters to be included in the request.
 * @param {Object} [body=null] - The request body to be sent (null for GET or HEAD requests).
 * @param {number} expectedCode - The expected HTTP status code for the failure (e.g., 404, 401).
 * @param {string} expectedMsg - The expected error message in the response.
 *
 * @returns {Promise<void>} - Resolves if the response matches expectations, otherwise throws an error.
 */
async function checkFailRequest(
  method,
  url,
  headers,
  params,
  body,
  expectedCode,
  expectedMsg
) {
  try {
    const response = await axios.request({
      method,
      url,
      headers,
      params,
      data: body
    })
    if (response.status >= 200 && response.status < 300) {
      throw new Error(
        `Expected a failure, but got response with status: ${response.status}`
      )
    }
  } catch (error) {
    if (error.response) {
      expect(error.response.status).toBe(expectedCode)
      expect(error.response.data.message).toBe(expectedMsg)
    } else {
      throw error
    }
  }
}

/**
 * Generates a valid 24-character ObjectId.
 * The ID consists of an 8-character hexadecimal timestamp and
 * a 16-character random hexadecimal string.
 *
 * @returns {string} Doctor object data.
 */
function generateObjectId() {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0')
  const randomPart = Math.random().toString(16).slice(2, 18).padEnd(16, '0')
  return timestamp + randomPart
}

/**
 * Creates a test doctor by sending a POST request to the user API.
 *
 * @returns {Promise<Object>} A promise that resolves to the created doctor user object.
 * @throws Will throw an error if the request fails.
 */
async function createTestDoctor() {
  try {
    const token = await getAuthToken()

    headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Origin: 'http://localhost'
    }

    doctorUser = {
      id: generateObjectId(),
      names: 'Dummy',
      lastNames: 'User',
      phones: ['12345678'],
      rol: 'Doctor',
      mails: ['test-doctor@example.com'],
      roleDependentInfo: {
        collegiateNumber: '12345',
        specialty: 'testSpecialty'
      }
    }

    const response = await axios.post(
      `${BASE_URL}/users/register`,
      doctorUser,
      { headers }
    )
    doctorUser.roleDependentInfo.id = response.data.roleId // Adding role specific id
    return doctorUser
  } catch (error) {
    if (error.response) {
      console.log(
        `Status: ${error.response.status} \nBody: ${JSON.stringify(error.response.data)}`
      )
    } else {
      console.error(`Error: ${error.message || error}`)
    }
    throw new Error('Test failed')
  }
}

/**
 * Deletes a user by sending a DELETE request to the user deletion API.
 *
 * @param {string} userID - The ID of the user to be deleted.
 * @returns {Promise<void>} A promise that resolves when the user is deleted.
 * @throws Will throw an error if the request fails.
 */
async function deleteUser(userID) {
  try {
    await axios.delete(`${BASE_URL}/users/delete`, {
      data: { id: userID },
      headers
    })
    return
  } catch (error) {
    console.log(
      `Status: ${error.response.status} \nBody: ${JSON.stringify(error.response.data)}`
    )
    throw new Error('Test failed')
  }
}

/**
 * Creates a patient template for a doctor.
 *
 * @param {string} userID - Doctor ID to create the template for.
 * @param {object} template - tempalte structure.
 * @returns {Promise<string>} a Promise to the templateId created.
 * @throws Will throw an error if the request fails.
 */
async function createTestPatientTemplate(
  doctorId,
  templateName,
  categories,
  fields
) {
  const testTemplate = {
    doctorId: doctorId,
    name: templateName,
    categories: categories,
    fields: fields
  }
  // console.log(testTemplate)

  try {
    const response = await axios.post(
      `${BASE_URL}/doctor/PatientTemplate`,
      testTemplate,
      { headers }
    )
    return response.data.data.patientTemplateId // Guardar el ID de la plantilla creada
  } catch (error) {
    if (error.response) {
      console.log(`Error creating template: ${JSON.stringify(error.response)}`)
    } else console.log(JSON.stringify(error, '', '  '))
    throw error
  }
}

/**
 * Creates a patient template for a doctor.
 *
 * @param {string} userID - Doctor ID to create the template for.
 * @param {object} template - tempalte structure.
 * @returns {Promise<string>} a Promise to the templateId created.
 * @throws Will throw an error if the request fails.
 */
async function createTestFileTemplate(doctorId, templateName, fields) {
  const testTemplate = {
    doctorId: doctorId,
    name: templateName,
    fields: fields
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/doctor/FileTemplate`,
      testTemplate,
      { headers }
    )
    return response.data.data.fileTemplateId // Guardar el ID de la plantilla creada
  } catch (error) {
    console.error(
      'Error creating template:',
      error.response ? error.response.data : error.message
    )
    throw error
  }
}

/**
 * Creates a record for a patient based on a template.
 *
 * @param {string} doctorId - Doctor ID to create the record for.
 * @param {string} templateId - The template ID that the record is based on.
 * @param {object} patientData - Patient data including names, lastnames, and fields.
 * @returns {Promise<string>} a Promise to the recordId created.
 * @throws Will throw an error if the request fails.
 */
async function createTestRecord(doctorId, templateId, patientData) {
  const HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  const recordData = {
    doctorId: doctorId,
    templateId: templateId,
    patient: patientData
  }

  try {
    const response = await axios.post(`${BASE_URL}/records/`, recordData, {
      headers: HEADERS
    })
    return response.data.recordId
  } catch (error) {
    console.error(
      'Error creating record:',
      error.response ? error.response.data : error.message
    )
    throw error
  }
}

/**
 * Creates a record for a patient based on a template.
 *
 * @param {object} fileData - File data including name, category, fields...
 * @returns {Promise<string>} a Promise to the recordId created.
 * @throws Will throw an error if the request fails.
 */
async function createTestFile(fileData) {
  const form = createFormDataWithFile(fileData)

  const HEADERS = {
    ...form.getHeaders(),
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  try {
    const response = await axios.post(`${BASE_URL}/files/`, form, {
      headers: HEADERS
    })
    return response.data.fileId
  } catch (error) {
    console.error(
      'Error creating record:',
      error.response ? error.response.data : error.message
    )
    throw error
  }
}

/**
 * Validates the structure of the given response data using the specified schema.
 *
 * This function ensures that the response data conforms to the provided schema
 * using Yup validation. It throws an error if the validation fails, indicating
 * any discrepancies in the structure of the data.
 *
 * @param {object} responseData - The data object to be validated.
 * @param {object} schema - A Yup schema object that defines the expected structure
 * and constraints for the response data.
 * @returns {Promise<void>} - Resolves if the validation is successful, otherwise throws an error.
 * @throws Will throw an error if the response data does not match the provided schema.
 */
async function validateResponse(responseData, schema) {
  try {
    // Validar si la estructura sigue el esquema
    await schema.validate(responseData, {
      strict: true,
      abortEarly: false
    })
    console.log('Record response structure is valid.')
  } catch (error) {
    console.error('Invalid response structure:', error.errors)
    throw error
  }
}

/**
 * Makes a clone of a Record object but by changing one field value.
 * @param {object} record: Record object to modify
 * @param {*} arrayPath: path of nested fields to get to the target field. Ex: "animal.food.vegetables"
 *                           will target and object like { animal : { food: { vegetables : [] } }}
 * @param {*} modification: Function to modify each of the values in the array field.
 * @returns the clone record with the field changed.
 */
function modifyObjectArray(record, arrayPath, modification) {
  const newObject = JSON.parse(JSON.stringify(record))

  // Navigate the object to the array specified by the arrayPath
  const pathParts = arrayPath.split('.')
  let target = newObject

  // Traverse all parts of the path except the last one
  for (let i = 0; i < pathParts.length - 1; i++) {
    target = target[pathParts[i]]
  }
  const finalKey = pathParts[pathParts.length - 1]
  target[finalKey] = target[finalKey].map((field) => {
    return modification(field)
  })

  return newObject
}

/**
 * Makes a clone of a Record object but by changing one field value.
 * @param {object} record: Record object to modify
 * @param {*} attributePath: path of nested fields to get to the target field. Ex: "animal.food.vegetables"
 *                           will target and object like { animal : { food: { vegetables : "value" } }}
 * @param {*} newValue: Value to replace on the specified field
 * @returns the clone record with the field changed.
 */
function modifyObjectAttribute(record, attributePath, newValue) {
  const newObject = JSON.parse(JSON.stringify(record))

  // Navigate the object to the array specified by the arrayPath
  const pathParts = attributePath.split('.')
  let targetAttribute = newObject

  // Traverse all parts of the path except the last one
  for (let i = 0; i < pathParts.length - 1; i++) {
    targetAttribute = targetAttribute[pathParts[i]]
  }

  const finalKey = pathParts[pathParts.length - 1]
  targetAttribute[finalKey] = newValue

  return newObject
}

/**
 * Makes a clone of a Record object but deletes a specified attribute.
 * @param {object} record: Record object to modify
 * @param {string} attributePath: Path to the attribute to delete (e.g., 'patient.info.age')
 * @returns the cloned record with the attribute deleted.
 */
function deleteObjectAttribute(record, attributePath) {
  const newRecord = JSON.parse(JSON.stringify(record)) // Deep copy the object

  // Split the path into parts
  const pathParts = attributePath.split('.')
  let targetAttribute = newRecord

  // Traverse all parts of the path except the last one
  for (let i = 0; i < pathParts.length - 1; i++) {
    targetAttribute = targetAttribute[pathParts[i]]
  }

  // Delete the attribute at the end of the path
  const finalKey = pathParts[pathParts.length - 1]
  delete targetAttribute[finalKey]

  return newRecord // Return the modified clone
}

/**
 * Build a search request body with customizable parameters.
 * @param {string} doctorId - ID of the doctor.
 * @param {number} limit - Maximum number of items per page (default: 10).
 * @param {number} page - Page number to retrieve (default: 0).
 * @param {Array} fields - For files search, that rquired filter by category.
 * @param {Array} fields - Fields to include in the response (default: []).
 * @param {Array} sorts - Sorting criteria (default: []).
 * @param {Array} filters - Filters to apply to the search (default: []).
 * @returns {Object} - The constructed request body.
 */
function buildSearchRequestBody({
  doctorId,
  limit = 10,
  page = 0,
  category = '',
  recordId = '',
  fields = [],
  sorts = [],
  filters = []
} = {}) {
  return {
    doctorId,
    limit,
    page,
    category,
    recordId,
    fields,
    sorts,
    filters
  }
}

/**
 * Build a filter object for the search request.
 * @param {string} name - Name of the field to filter.
 * @param {string} type - Type of the field (e.g., NUMBER, TEXT).
 * @param {string} operation - Operation to apply (e.g., 'less_than', 'contains').
 * @param {Array} values - Array of values for the filter.
 * @param {string} logicGate - Logic gate for combining filters (e.g., 'and', 'or').
 * @returns {Object} - The constructed filter object.
 */
function buildFilterObject(name, type, operation, values, logicGate = 'and') {
  return {
    name,
    type,
    operation,
    values,
    logicGate
  }
}

/**
 * Build a sort object for the search request.
 * @param {string} name - Name of the field to sort.
 * @param {string} type - Type of the field (e.g., DATE, NUMBER).
 * @param {string} mode - Sorting mode ('asc' or 'desc').
 * @returns {Object} - The constructed sort object.
 */
function buildSortObject(name, type, mode) {
  return {
    name,
    type,
    mode
  }
}

/**
 * The manipulation of files requires a lot of other entities to set up first: a doctor,
 * patientTemplate, record, and fileTempalte. This function encapsulates the logic to do so,
 * and return the created entities.
 * @param {} categories list of posible file categories.
 * @param {*} fileTemplateName Name of the fileTemplate
 * @param {*} fileTemplateFields Fields for the fileTemplate
 * @returns doctor object, patientTemplatId, recordId, fileTemplateId.
 */
async function setUpEnvironmentForFilesTests(
  categories,
  fileTemplateName,
  fileTemplateFields
) {
  try {
    const doctor = await createTestDoctor()
    const patientTemplateId = await createTestPatientTemplate(
      doctor.roleDependentInfo.id,
      `template_${Date.now()}`,
      categories,
      [
        {
          name: 'edad',
          type: 'NUMBER',
          required: true,
          description: '_'
        }
      ]
    )
    const fileTemplateId = await createTestFileTemplate(
      doctor.roleDependentInfo.id,
      fileTemplateName,
      fileTemplateFields
    )
    const recordId = await createTestRecord(
      doctor.roleDependentInfo.id,
      patientTemplateId,
      {
        names: 'user',
        lastnames: 'test',
        fields: [
          {
            name: 'edad',
            value: 30
          }
        ]
      }
    )
    return { doctor, patientTemplateId, recordId, fileTemplateId }
  } catch (error) {
    console.error(`Error setting up environments for files. ${error}`)
    throw error
  }
}

function createFormDataWithFile(body) {
  const form = new FormData()

  // Append the metadata first.
  form.append('metadata', JSON.stringify(body))

  // Append a test PDF file.
  const filePath = path.join(__dirname, './routes/files/testFile.pdf')
  const fileName = 'testFile.pdf'
  form.append('file', fs.createReadStream(filePath), { fileName: fileName })

  return form
}
module.exports = {
  iso8601Regex,
  checkFailRequest,
  generateObjectId,
  createTestDoctor,
  deleteUser,
  createTestPatientTemplate,
  createTestFileTemplate,
  createTestRecord,
  createTestFile,
  validateResponse,
  modifyObjectArray,
  modifyObjectAttribute,
  deleteObjectAttribute,
  buildSearchRequestBody,
  buildFilterObject,
  buildSortObject,
  setUpEnvironmentForFilesTests,
  createFormDataWithFile
}
