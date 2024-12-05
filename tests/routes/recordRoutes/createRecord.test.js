const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../jest.setup')
const {
  createTestDoctor,
  deleteUser,
  createTestPatientTemplate,
  checkFailRequest,
  modifyObjectAttribute,
  modifyObjectArray,
  deleteObjectAttribute
} = require('../../testHelpers')
const COMMON_MSG = require('../../errorMsg')

describe('Create Records Tests', () => {
  let userId, doctorId, templateId

  const REQUEST_URL = `${BASE_URL}/records/`

  const HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  const BASE_RECORD = {
    doctorId: '', // will be filled on the beforeAll method
    templateId: '',
    patient: {
      names: 'Juan',
      lastnames: 'Pérez García',
      fields: [
        {
          name: 'Estado Civil',
          value: 'Soltero'
        },
        {
          name: 'Edad',
          value: 30
        },
        {
          name: 'Peso en kg',
          value: 70.5
        },
        {
          name: 'Notas adicionales',
          value: 'Paciente en buenas condiciones'
        },
        {
          name: 'Observaciones breves',
          value: 'Revisión rápida'
        },
        {
          name: 'Fecha de nacimiento',
          value: '1992-01-15'
        }
      ]
    }
  }

  async function checkFailCreateRequest(body, expectedCode, expectedMsg) {
    return checkFailRequest(
      'post',
      REQUEST_URL,
      HEADERS,
      {},
      body,
      expectedCode,
      expectedMsg
    )
  }

  function modifyRecordAttribute(attributePath, newValue) {
    return modifyObjectAttribute(BASE_RECORD, attributePath, newValue)
  }

  function modifyRecordField(fieldName, newValue) {
    return modifyObjectArray(BASE_RECORD, `patient.fields`, (field) => {
      if (field.name === fieldName) field.value = newValue
      return field
    })
  }

  function deleteRecordAttribute(attributePath) {
    return deleteObjectAttribute(BASE_RECORD, attributePath)
  }

  beforeAll(async () => {
    const doctor = await createTestDoctor()
    userId = doctor.id
    doctorId = doctor.roleDependentInfo.id

    templateId = await createTestPatientTemplate(
      doctorId,
      `Plantilla de Identificación_${Date.now()}`,
      ['General', 'Consultas'],
      [
        {
          name: 'Estado Civil',
          type: 'CHOICE',
          options: ['Soltero', 'Casado'],
          required: true,
          description: 'Estado civil del paciente'
        },
        {
          name: 'Edad',
          type: 'NUMBER',
          required: true,
          description: 'Edad del paciente'
        },
        {
          name: 'Peso en kg',
          type: 'FLOAT',
          required: true,
          description: 'Peso del paciente'
        },
        {
          name: 'Notas adicionales',
          type: 'TEXT',
          required: false,
          description: 'Notas adicionales del paciente'
        },
        {
          name: 'Observaciones breves',
          type: 'SHORT_TEXT',
          required: true,
          description: 'Observaciones rápidas'
        },
        {
          name: 'Fecha de nacimiento',
          type: 'DATE',
          required: true,
          description: 'Fecha de nacimiento del paciente'
        }
      ]
    )

    BASE_RECORD.doctorId = doctorId // Update the BASE RECORD doctorId
    BASE_RECORD.templateId = templateId // Also update the templateId
  })

  afterAll(async () => {
    await deleteUser(userId)
  })

  // TODO:
  test('should succeed with 200 creating a record', async () => {
    const recordBody = BASE_RECORD

    try {
      const response = await axios.post(REQUEST_URL, recordBody, {
        headers: HEADERS
      })
      expect(response.status).toBe(200)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    } catch (error) {
      console.error(
        'Error creating record:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })

  // TODO:
  test('should fail with 400 if doctorId not passed', async () => {
    const record = deleteRecordAttribute('doctorId')
    await checkFailCreateRequest(record, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test('should fail with 400 if templateId not passed', async () => {
    const record = deleteRecordAttribute('templateId')
    await checkFailCreateRequest(record, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test('should fail with 400 if patient not passed', async () => {
    const record = deleteRecordAttribute('patient')
    await checkFailCreateRequest(record, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test('should fail with 400 if patient names not passed', async () => {
    const record = deleteRecordAttribute('patient.names')
    await checkFailCreateRequest(record, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test('should fail with 400 if patient lastnames not passed', async () => {
    const record = deleteRecordAttribute('patient.lastnames')
    await checkFailCreateRequest(record, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test('should fail with 400 if patient fields not passed', async () => {
    const record = deleteRecordAttribute('patient.fields')
    await checkFailCreateRequest(record, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test('should fail with 404 if doctorId is from a not active/existent doctor', async () => {
    const record = modifyRecordAttribute('doctorId', 'nonExistentDoctorId')
    await checkFailCreateRequest(record, 404, COMMON_MSG.DOCTOR_NOT_FOUND)
  })

  // TODO:
  test('should fail with 404 if templateId is from a not-existent template', async () => {
    const record = modifyRecordAttribute('templateId', 'nonExistentDoctorId')
    await checkFailCreateRequest(record, 404, COMMON_MSG.TEMPLATE_NOT_FOUND)
  })

  // TODO:
  test('should fail with 404 if not all fields defined by the template are not sent', async () => {
    await checkFailCreateRequest(
      {
        doctorId: doctorId,
        templateId: templateId,
        patient: {
          names: 'Juan',
          lastnames: 'Pérez García',
          fields: [
            {
              name: 'Estado Civil',
              value: 'Soltero'
            },
            {
              name: 'Edad',
              value: 30
            }
          ]
        }
      },
      404,
      COMMON_MSG.MISSING_FIELDS_IN_TEMPLATE
    )
  })

  // ==================
  // === TEXT ===
  // ==================
  // DONE:
  test.skip('should fail with 405 when passing NUMBER value for TEXT field', async () => {
    const record = modifyRecordField('Notas adicionales', 123)
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_TEXT
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN value for TEXT field', async () => {
    const record = modifyRecordField('Notas adicionales', true)
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_TEXT
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing ARRAY value for TEXT field', async () => {
    const record = modifyRecordField('Notas adicionales', [])
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_TEXT
    )
  })

  // ==================
  // === SHORT_TEXT ===
  // ==================
  // DONE:
  test.skip('should fail with 405 when passing NUMBER value for SHORT_TEXT field', async () => {
    const record = modifyRecordField('Observaciones breves', 123)
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_SHORT_TEXT
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN value for SHORT_TEXT field', async () => {
    const record = modifyRecordField('Observaciones breves', true)
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_SHORT_TEXT
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing ARRAY value for SHORT_TEXT field', async () => {
    const record = modifyRecordField('Observaciones breves', [])
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_SHORT_TEXT
    )
  })

  // ==================
  // === NUMBER ===
  // ==================
  // DONE:
  test.skip('should fail with 405 when passing TEXT value for NUMBER field', async () => {
    const record = modifyRecordField('Edad', '321')
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_NUMBER
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN value for NUMBER field', async () => {
    const record = modifyRecordField('Edad', false)
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_NUMBER
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing ARRAY value for NUMBER field', async () => {
    const record = modifyRecordField('Edad', [])
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_NUMBER
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing FLOAT value for NUMBER field', async () => {
    const record = modifyRecordField('Edad', 32.3)
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_NUMBER
    )
  })

  // ==================
  // === FLOAT ===
  // ==================
  // DONE:
  test.skip('should fail with 405 when passing TEXT value for FLOAT field', async () => {
    const record = modifyRecordField('Peso en kg', '32.2')
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_FLOAT
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN value for FLOAT field', async () => {
    const record = modifyRecordField('Peso en kg', true)
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_FLOAT
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing ARRAY value for FLOAT field', async () => {
    const record = modifyRecordField('Peso en kg', [])
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_FLOAT
    )
  })

  // ==================
  // === CHOICE =======
  // ==================
  // DONE:
  test.skip('should fail with 405 when passing NUMBER values to CHOICE', async () => {
    const record = modifyRecordField('Estado Civil', 32)
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_CHOICE
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN values to CHOICE', async () => {
    const record = modifyRecordField('Estado Civil', true)
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_CHOICE
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing VALUE that is not within CHOICE value', async () => {
    const record = modifyRecordField('Estado Civil', 'Camello')
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_VALUE_CHOICE
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing ARRAY value for CHOICE field', async () => {
    const record = modifyRecordField('Estado Civil', [])
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_CHOICE
    )
  })

  // ==================
  // === DATE =======
  // ==================
  // DONE:
  test.skip('should fail with 405 when passing TEXT value for DATE field', async () => {
    const record = modifyRecordField('Fecha de nacimiento', 'aloha')
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_DATE
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN value for DATE field', async () => {
    const record = modifyRecordField('Fecha de nacimiento', true)
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_DATE
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing NUMBER value for DATE field', async () => {
    const record = modifyRecordField('Fecha de nacimiento', 32)
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_DATE
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing ARRAY value for DATE field', async () => {
    const record = modifyRecordField('Fecha de nacimiento', [])
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_DATE
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing date not in ISO8601 format for DATE field', async () => {
    const record = modifyRecordField('Fecha de nacimiento', '23/3/2024')
    await checkFailCreateRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_DATE
    )
  })
})
