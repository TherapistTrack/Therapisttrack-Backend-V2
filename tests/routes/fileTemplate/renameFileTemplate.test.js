const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../jest.setup')
const COMMON_MSG = require('../../errorMsg')
const {
  createTestDoctor,
  deleteUser,
  checkFailRequest,
  createTestFileTemplate
} = require('../../testHelpers')

describe('Rename File Template Tests', () => {
  let doctor, secondDoctor, templateId, secondTemplateId

  const REQUEST_URL = `${BASE_URL}/doctor/FileTemplate`

  const HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  async function checkFailRenameRequest(body, expectedCode, expectedMsg) {
    return checkFailRequest(
      'patch',
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
    secondTemplateId = await createTestFileTemplate(
      doctor.roleDependentInfo.id,
      `secondTemplate`,
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
  test('should rename with 200 a file template correctly', async () => {
    const data = {
      doctorId: doctor.roleDependentInfo.id,
      templateId: templateId,
      name: 'newName'
    }

    try {
      const response = await axios.patch(REQUEST_URL, data, {
        headers: HEADERS
      })
      expect(response.status).toBe(200)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    } catch (error) {
      console.error(
        'Error renaming template:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })

  // DONE:
  test("should fail with 400 to rename template if 'doctorId' is not provided", async () => {
    await checkFailRenameRequest(
      {
        templateId: templateId,
        name: 'NewName'
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test("should fail with 400 to rename template if 'templateId' is not provided", async () => {
    await checkFailRenameRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        name: 'NewName'
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test("should fail with 400 to rename template if 'name' is not provide", async () => {
    await checkFailRenameRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        templateId: templateId
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test("should fail with 403 to rename template if 'doctorid' exist but is not the owner of this template", async () => {
    await checkFailRenameRequest(
      {
        doctorId: secondDoctor.roleDependentInfo.id,
        templateId: templateId,
        name: 'NewName'
      },
      403,
      COMMON_MSG.DOCTOR_IS_NOT_OWNER
    )
  })

  // DONE:
  test("should fail with 404 to rename template if 'doctorid' is not from a valid/active user", async () => {
    await checkFailRenameRequest(
      {
        doctorId: 'nonExistentDoctor',
        templateId: templateId,
        name: 'NewName'
      },
      404,
      COMMON_MSG.DOCTOR_NOT_FOUND
    )
  })

  // DONE:
  test("should fail with 404 to rename template if 'template' is not from a valid/active template", async () => {
    await checkFailRenameRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        templateId: 'notExistentTemplate',
        name: 'NewName'
      },
      404,
      COMMON_MSG.TEMPLATE_NOT_FOUND
    )
  })
  // DONE:
  test('should fail with 406 when trying to rename template to with a existent template name', async () => {
    await checkFailRenameRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        templateId: secondTemplateId,
        name: 'newName'
      },
      406,
      COMMON_MSG.RECORDS_USING
    )
  })
})
