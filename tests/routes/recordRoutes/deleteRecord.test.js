const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../jest.setup')
const {
  createTestDoctor,
  createTestPatientTemplate,
  createTestRecord,
  deleteUser,
  checkFailRequest,
  generateObjectId
} = require('../../testHelpers')
const COMMON_MSG = require('../../errorMsg')

describe('Delete Records Tests', () => {
  let userId, doctorId, secondDoctor, recordId, templateId

  const REQUEST_URL = `${BASE_URL}/records/`

  const HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  async function checkFailDeleteRequest(body, expectedCode, expectedMsg) {
    return checkFailRequest(
      'delete',
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
        }
      ]
    )

    const patientData = {
      names: 'Juan',
      lastnames: 'Pérez García',
      fields: [
        {
          name: 'Estado Civil',
          value: 'Soltero'
        }
      ]
    }
    recordId = await createTestRecord(doctorId, templateId, patientData)
  })

  afterAll(async () => {
    await Promise.all([deleteUser(userId), deleteUser(secondDoctor.id)])
  })

  // TODO:
  test('should fail with 400 if recordId is not passed', async () => {
    await checkFailDeleteRequest(
      {
        doctorId: doctorId
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // TODO:
  test('should fail with 400 if doctorId is not passed', async () => {
    await checkFailDeleteRequest(
      {
        recordId: recordId
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // TODO:
  test('should fail with 403 if doctor is not owner of record', async () => {
    await checkFailDeleteRequest(
      {
        recordId: recordId,
        doctorId: secondDoctor.roleDependentInfo.id
      },
      403,
      COMMON_MSG.DOCTOR_IS_NOT_OWNER
    )
  })

  // TODO:
  test('should fail with 404 if doctorId is from a non-existent/active user', async () => {
    await checkFailDeleteRequest(
      {
        recordId: recordId,
        doctorId: generateObjectId()
      },
      404,
      COMMON_MSG.DOCTOR_NOT_FOUND
    )
  })

  // TODO:
  test('should fail with 404 if recordId is from a non-existent record', async () => {
    await checkFailDeleteRequest(
      {
        recordId: generateObjectId(),
        doctorId: doctorId
      },
      404,
      COMMON_MSG.RECORD_NOT_FOUND
    )
  })

  // TODO:
  /*test('should fail with 409 if recordId has files stored within', async () => {
    // can only be implemented when endpoints for file managemente are created.
    await checkFailDeleteRequest(
      {
        recordId: recordId,
        doctorId: doctorId
      },
      409,
      COMMON_MSG.OPERATION_REJECTED
    )
  })*/

  // TODO:
  test('should succeed with 200 deleting a record', async () => {
    const deleteBody = {
      recordId: recordId,
      doctorId: doctorId
    }

    try {
      const response = await axios.delete(REQUEST_URL, {
        headers: HEADERS,
        data: deleteBody
      })
      expect(response.status).toBe(200)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    } catch (error) {
      console.error(
        'Error deleting record:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })
})
