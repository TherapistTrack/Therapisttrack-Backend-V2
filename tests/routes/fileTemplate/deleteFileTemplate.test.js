const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../jest.setup')
const COMMON_MSG = require('../../errorMsg')
const {
  createTestDoctor,
  deleteUser,
  checkFailRequest,
  createTestFileTemplate
} = require('../../testHelpers')

describe('Delete File Template Tests', () => {
  let doctor, secondDoctor, templateId

  const REQUEST_URL = `${BASE_URL}/doctor/FileTemplate`

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
    templateId = await createTestFileTemplate(
      doctor.roleDependentInfo.id,
      `testTemplate_${Date.now()}`,
      [
        {
          name: 'Edad',
          type: 'NUMBER',
          required: true,
          description: 'Edad del paciente'
        }
      ]
    )
  })

  afterAll(async () => {
    await Promise.all([deleteUser(doctor.id), deleteUser(secondDoctor.id)])
  })

  // DONE:
  test("should fail with 400 to delete template if 'doctorId' is not provided", async () => {
    await checkFailDeleteRequest(
      {
        templateId: templateId
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test("should fail with 400 to delete template if 'templateId' is not provided", async () => {
    await checkFailDeleteRequest(
      {
        doctorId: doctor.roleDependentInfo.id
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test("should fail with 403 to delete template if 'doctorid' exist but is not the owner of this template", async () => {
    await checkFailDeleteRequest(
      {
        doctorId: secondDoctor.roleDependentInfo.id,
        templateId: templateId
      },
      403,
      COMMON_MSG.DOCTOR_IS_NOT_OWNER
    )
  })

  // DONE:
  test("should fail with 404 to delete template if 'doctorid' is not from a valid/active user", async () => {
    await checkFailDeleteRequest(
      {
        doctorId: 'NonExistentDoctor',
        templateId: templateId
      },
      404,
      COMMON_MSG.DOCTOR_NOT_FOUND
    )
  })

  // DONE:
  test("should fail with 404 to delete template if 'template' is not from a valid/existent template", async () => {
    await checkFailDeleteRequest(
      {
        doctorId: secondDoctor.roleDependentInfo.id,
        templateId: 'nonExistentTemplate'
      },
      404,
      COMMON_MSG.TEMPLATE_NOT_FOUND
    )
  })

  // DONE:
  test('should delete with 200 a file template correctly', async () => {
    const data = {
      doctorId: doctor.roleDependentInfo.id,
      templateId: templateId
    }
    try {
      const response = await axios.delete(REQUEST_URL, {
        headers: HEADERS,
        data: data
      })
      expect(response.status).toBe(200)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    } catch (error) {
      console.error(
        'Error deleting template:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })
})
