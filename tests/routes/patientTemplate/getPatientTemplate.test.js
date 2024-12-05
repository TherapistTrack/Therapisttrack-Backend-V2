const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../jest.setup')
const COMMON_MSG = require('../../errorMsg')
const {
  createTestDoctor,
  deleteUser,
  checkFailRequest,
  createTestPatientTemplate
} = require('../../testHelpers')

describe('Get Patient Template by ID Tests', () => {
  let doctor, secondDoctor
  let templateId

  const REQUEST_URL = `${BASE_URL}/doctor/PatientTemplate`

  const HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  async function checkFailGetRequest(queryParams, expectedCode, expectedMsg) {
    return checkFailRequest(
      'get',
      REQUEST_URL,
      HEADERS,
      queryParams,
      {},
      expectedCode,
      expectedMsg
    )
  }

  beforeAll(async () => {
    doctor = await createTestDoctor()
    secondDoctor = await createTestDoctor()

    // Crear una plantilla de paciente para usarla en los tests
    templateId = await createTestPatientTemplate(
      doctor.roleDependentInfo.id,
      `Plantilla-2024`,
      ['General', 'Urgente'],
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

  //
  test('should success with 200 retrieve a patient template by its ID', async () => {
    try {
      const response = await axios.get(REQUEST_URL, {
        params: {
          doctorId: doctor.roleDependentInfo.id,
          templateId: templateId
        },
        headers: HEADERS
      })
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveProperty('lastUpdate')
      expect(response.data.data).toHaveProperty('name', 'Plantilla-2024')
      expect(response.data.data.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Edad',
            type: 'NUMBER',
            required: true,
            description: 'Edad del paciente'
          }),
          expect.objectContaining({
            name: 'Estado Civil',
            type: 'CHOICE',
            options: ['Soltero', 'Casado'],
            required: true,
            description: 'Estado civil del paciente'
          })
        ])
      )
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    } catch (error) {
      console.error(
        'Error retrieving template by ID:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })

  // DONE:
  test('should fail with 400 if "doctorId" is not provided', async () => {
    await checkFailGetRequest(
      {
        templateId
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test('should fail with 400 if "templateId" is not provided', async () => {
    await checkFailGetRequest(
      {
        doctorId: doctor.roleDependentInfo.id
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test('should fail with 403 if "doctorId" exist but is not the owner of the template', async () => {
    const wrongDoctorId = secondDoctor.roleDependentInfo.id

    await checkFailGetRequest(
      {
        doctorId: wrongDoctorId,
        templateId
      },
      403,
      COMMON_MSG.DOCTOR_IS_NOT_OWNER
    )
  })

  // DONE:
  test('should fail with 404 if "doctorId" does not correspond to an existent/active doctor', async () => {
    const nonExistentDoctorId = 'invalidDoctorId'

    await checkFailGetRequest(
      {
        doctorId: nonExistentDoctorId,
        templateId
      },
      404,
      COMMON_MSG.DOCTOR_NOT_FOUND
    )
  })

  // DONE:
  test('should fail with 404 if "template" does not correspond to an existent template', async () => {
    const nonExistentTemplateId = 'invalidTemplateId'

    await checkFailGetRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        templateId: nonExistentTemplateId
      },
      404,
      COMMON_MSG.TEMPLATE_NOT_FOUND
    )
  })
})
