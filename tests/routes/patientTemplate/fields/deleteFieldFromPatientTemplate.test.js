const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../../jest.setup')
const {
  createTestDoctor,
  deleteUser,
  createTestPatientTemplate,
  checkFailRequest
} = require('../../../testHelpers')
const COMMON_MSG = require('../../../errorMsg')

describe('Delete Field from Patient Template Tests', () => {
  let doctor, secondDoctor, templateId

  const REQUEST_URL = `${BASE_URL}/doctor/PatientTemplate/fields`

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
    doctor = await createTestDoctor()
    secondDoctor = await createTestDoctor()

    templateId = await createTestPatientTemplate(
      doctor.roleDependentInfo.id,
      `testTemplate_${Date.now()}`,
      ['General'],
      [
        {
          name: 'Edad',
          type: 'NUMBER',
          required: true,
          description: 'Edad del paciente'
        },
        {
          name: 'Estado Civil',
          type: 'CHOICE',
          options: ['Soltero', 'Casado'],
          required: true,
          description: 'Estado civil del paciente'
        }
      ]
    )
  })

  afterAll(async () => {
    await Promise.all([deleteUser(doctor.id), deleteUser(secondDoctor.id)])
  })

  // DONE:
  test('should suceed with 200 delete an existing field from the patient template', async () => {
    const fieldToDelete = {
      doctorId: doctor.roleDependentInfo.id,
      templateId: templateId,
      name: 'Edad'
    }

    try {
      const response = await axios.delete(REQUEST_URL, {
        data: fieldToDelete,
        headers: HEADERS
      })
      expect(response.status).toBe(200)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    } catch (error) {
      console.error(
        'Error deleting field:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })

  // DONE:
  test('should fail with 400 to delete a field without templateID', async () => {
    await checkFailDeleteRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        name: 'Edad' // Omitimos templateID para provocar el error
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test('should fail with 400 to delete a field without doctorId', async () => {
    await checkFailDeleteRequest(
      {
        templateId: templateId,
        name: 'Edad'
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test('should fail with 400 to delete a field without name', async () => {
    await checkFailDeleteRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        templateId: templateId
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test('should fail with 403 if doctor is not owner of the template', async () => {
    await checkFailDeleteRequest(
      {
        doctorId: secondDoctor.roleDependentInfo.id,
        templateId: templateId,
        name: 'Edad'
      },
      403,
      COMMON_MSG.DOCTOR_IS_NOT_OWNER
    )
  })

  // DONE:
  test('should fail with 404 when doctorId is not valid/active', async () => {
    await checkFailDeleteRequest(
      {
        doctorId: 'nonExistentDoctor',
        templateId: templateId,
        name: 'Edad'
      },
      404,
      COMMON_MSG.DOCTOR_NOT_FOUND
    )
  })

  // DONE:
  test('should fail with 404 when templateID is not valid/existent', async () => {
    await checkFailDeleteRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        templateId: 'nonExistentTemplate',
        name: 'Edad'
      },
      404,
      COMMON_MSG.TEMPLATE_NOT_FOUND
    )
  })

  // DONE:
  test('should fail with 404 when "name" does not exist', async () => {
    await checkFailDeleteRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        templateId: templateId,
        name: 'doesNotExist'
      },
      404,
      COMMON_MSG.FIELD_NOT_FOUND
    )
  })
})
