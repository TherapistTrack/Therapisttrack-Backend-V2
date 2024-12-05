const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../jest.setup')
const {
  createTestDoctor,
  createTestPatientTemplate,
  createTestRecord,
  deleteUser,
  checkFailRequest,
  modifyObjectAttribute,
  modifyObjectArray,
  deleteObjectAttribute,
  generateObjectId
} = require('../../testHelpers')
const COMMON_MSG = require('../../errorMsg')

describe('Edit Records Tests', () => {
  let userId, doctorId, secondDoctor, templateId, recordId

  const REQUEST_URL = `${BASE_URL}/records/`

  const HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  const BASE_RECORD = {
    doctorId: '', // will be filled on the beforeAll method
    recordId: '',
    patient: {
      names: 'Juan',
      lastnames: 'Pérez García',
      fields: [
        {
          name: 'Estado Civil',
          options: ['Soltero', 'Casado'],
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
          value: '2024-11-13T14:30:00Z'
        }
      ]
    }
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

  async function checkFailEditRequest(body, expectedCode, expectedMsg) {
    return checkFailRequest(
      'put',
      REQUEST_URL,
      HEADERS,
      {},
      body,
      expectedCode,
      expectedMsg
    )
  }

  beforeAll(async () => {
    const doctor = await createTestDoctor()
    secondDoctor = await createTestDoctor()
    userId = doctor.id
    doctorId = doctor.roleDependentInfo.id

    // Create a patient template for the doctor.
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

    // Create a test record using the created template.
    recordId = await createTestRecord(doctorId, templateId, BASE_RECORD.patient)

    BASE_RECORD.doctorId = doctorId // Update the BASE RECORD doctorId
    BASE_RECORD.recordId = recordId // Also update the recordId
  })

  afterAll(async () => {
    await Promise.all([deleteUser(userId), deleteUser(secondDoctor.id)])
  })

  // TODO:
  test('should succeed with 200 editing a record', async () => {
    const recordEditBody = {
      recordId: recordId,
      doctorId: doctorId,
      patient: {
        names: 'Juan Editado',
        lastnames: 'Pérez García',
        fields: [
          {
            name: 'Estado Civil',
            options: ['Soltero', 'Casado'],
            value: 'Casado'
          },
          {
            name: 'Edad',
            value: 33
          },
          {
            name: 'Peso en kg',
            value: 40.5
          },
          {
            name: 'Notas adicionales',
            value: 'Condiciones medias'
          },
          {
            name: 'Observaciones breves',
            value: 'Otras observacoines'
          },
          {
            name: 'Fecha de nacimiento',
            value: '2024-11-13T14:30:00Z'
          }
        ]
      }
    }

    try {
      const response = await axios.put(REQUEST_URL, recordEditBody, {
        headers: HEADERS
      })

      expect(response.status).toBe(200)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    } catch (error) {
      console.error(
        'Error editing record:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })

  // TODO:
  test('should fail with 400 if recordId is not passed', async () => {
    const record = deleteRecordAttribute('recordId')
    await checkFailEditRequest(record, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test('should fail with 400 if doctorId is not passed', async () => {
    const record = deleteRecordAttribute('doctorId')
    await checkFailEditRequest(record, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test('should fail with 400 if patient is not passed', async () => {
    const record = deleteRecordAttribute('patient')
    await checkFailEditRequest(record, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test('should fail with 403 if doctor is not the owner', async () => {
    const record = modifyRecordAttribute(
      'doctorId',
      secondDoctor.roleDependentInfo.id
    )
    await checkFailEditRequest(record, 403, COMMON_MSG.DOCTOR_IS_NOT_OWNER)
  })

  // TODO:
  test('should fail with 400 if patient is passed malformed (missing fields)', async () => {
    await checkFailEditRequest(
      {
        recordId: recordId,
        doctorId: doctorId,
        patient: {
          names: 'Juan'
        }
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // TODO:
  test('should fail with 404 if doctorId is from a non-existent/active user', async () => {
    const record = modifyRecordAttribute('doctorId', 'nonExistentDoctorId')
    await checkFailEditRequest(record, 404, COMMON_MSG.DOCTOR_NOT_FOUND)
  })

  // TODO:
  test('should fail with 404 if recordId is from a non-existent record', async () => {
    const record = modifyRecordAttribute('recordId', generateObjectId())
    await checkFailEditRequest(record, 404, COMMON_MSG.RECORD_NOT_FOUND)
  })

  // TODO:
  test('should fail with 404 if not all fields defined by the template are not sent', async () => {
    await checkFailEditRequest(
      {
        recordId: recordId,
        doctorId: doctorId,
        patient: {
          names: 'Juan',
          lastnames: 'Pérez García',
          fields: [
            {
              name: 'Fecha de nacimiento',
              value: '2024-11-13T14:30:00Z'
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
    const record = modifyRecordField('Notas Adicionales', 123)
    await checkFailEditRequest(record, 405, COMMON_MSG.INVALID_FIELD_TYPE_TEXT)
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN value for TEXT field', async () => {
    const record = modifyRecordField('Notas Adicionales', true)
    await checkFailEditRequest(record, 405, COMMON_MSG.INVALID_FIELD_TYPE_TEXT)
  })

  // DONE:
  test.skip('should fail with 405 when passing ARRAY value for TEXT field', async () => {
    const record = modifyRecordField('Notas Adicionales', [])
    await checkFailEditRequest(record, 405, COMMON_MSG.INVALID_FIELD_TYPE_TEXT)
  })

  // ==================
  // === SHORT_TEXT ===
  // ==================
  // DONE:
  test.skip('should fail with 405 when passing NUMBER value for SHORT_TEXT field', async () => {
    const record = modifyRecordField('Observaciones breves', 123)
    await checkFailEditRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_SHORT_TEXT
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN value for SHORT_TEXT field', async () => {
    const record = modifyRecordField('Observaciones breves', true)
    await checkFailEditRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_SHORT_TEXT
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing ARRAY value for SHORT_TEXT field', async () => {
    const record = modifyRecordField('Observaciones breves', [])
    await checkFailEditRequest(
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
    const record = modifyRecordField('Edad', '12')
    await checkFailEditRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_NUMBER
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN value for NUMBER field', async () => {
    const record = modifyRecordField('Edad', true)
    await checkFailEditRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_NUMBER
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing ARRAY value for NUMBER field', async () => {
    const record = modifyRecordField('Edad', [])
    await checkFailEditRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_NUMBER
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing FLOAT value for NUMBER field', async () => {
    // Number field just accepts integers
    const record = modifyRecordField('Edad', 12.5)
    await checkFailEditRequest(
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
    const record = modifyRecordField('Peso en kg', '12.5')
    await checkFailEditRequest(record, 405, COMMON_MSG.INVALID_FIELD_TYPE_FLOAT)
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN value for FLOAT field', async () => {
    const record = modifyRecordField('Peso en kg', true)
    await checkFailEditRequest(record, 405, COMMON_MSG.INVALID_FIELD_TYPE_FLOAT)
  })

  // DONE:
  test.skip('should fail with 405 when passing ARRAY value for FLOAT field', async () => {
    const record = modifyRecordField('Peso en kg', [])
    await checkFailEditRequest(record, 405, COMMON_MSG.INVALID_FIELD_TYPE_FLOAT)
  })

  // ==================
  // === CHOICE =======
  // ==================
  // DONE:
  test.skip('should fail with 405 when passing NUMBER values to CHOICE', async () => {
    const record = modifyRecordField('Estado Civil', 32)
    await checkFailEditRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_CHOICE
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN values to CHOICE', async () => {
    const record = modifyRecordField('Estado Civil', true)
    await checkFailEditRequest(
      record,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_CHOICE
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing VALUE that is not within CHOICE value', async () => {
    const record = modifyRecordField('Estado Civil', 'camello')
    await checkFailEditRequest(record, 405, COMMON_MSG.INVALID_CHOICE_VALUE)
  })

  // DONE:
  test.skip('should fail with 405 when passing ARRAY value for CHOICE field', async () => {
    const record = modifyRecordField('Estado Civil', [])
    await checkFailEditRequest(
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
    const record = modifyRecordField('Fecha de nacimiento', 'hola')
    await checkFailEditRequest(record, 405, COMMON_MSG.INVALID_FIELD_TYPE_DATE)
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN value for DATE field', async () => {
    const record = modifyRecordField('Fecha de nacimiento', true)
    await checkFailEditRequest(record, 405, COMMON_MSG.INVALID_FIELD_TYPE_DATE)
  })

  // DONE:
  test.skip('should fail with 405 when passing NUMBER value for DATE field', async () => {
    const record = modifyRecordField('Fecha de nacimiento', 1234)
    await checkFailEditRequest(record, 405, COMMON_MSG.INVALID_FIELD_TYPE_DATE)
  })

  // DONE:
  test.skip('should fail with 405 when passing ARRAY value for DATE field', async () => {
    const record = modifyRecordField('Fecha de nacimiento', [])
    await checkFailEditRequest(record, 405, COMMON_MSG.INVALID_FIELD_TYPE_DATE)
  })

  // DONE:
  test.skip('should fail with 405 when passing date not in ISO8601 format for DATE field', async () => {
    const record = modifyRecordField('Fecha de nacimiento', '23/3/2024')
    await checkFailEditRequest(record, 405, COMMON_MSG.INVALID_FIELD_TYPE_DATE)
  })
})
