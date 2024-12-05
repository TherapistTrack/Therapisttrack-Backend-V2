const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../jest.setup')
const COMMON_MSG = require('../../errorMsg')
const {
  createTestDoctor,
  deleteUser,
  checkFailRequest,
  createTestPatientTemplate
} = require('../../testHelpers')

describe('List Patiente Templates Tests', () => {
  let doctor

  const REQUEST_URL = `${BASE_URL}/doctor/PatientTemplate/list`

  const HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  async function checkFailListRequest(queryParams, expectedCode, expectedMsg) {
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

    // Crear varias plantillas de paciente para usarlas en los tests
    templateId1 = await createTestPatientTemplate(
      doctor.roleDependentInfo.id,
      `testTemplate1_${Date.now()}`,
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

    templateId2 = await createTestPatientTemplate(
      doctor.roleDependentInfo.id,
      `testTemplate2_${Date.now()}`,
      ['General', 'Urgente'],
      [
        {
          name: 'Altura',
          type: 'NUMBER',
          required: true,
          description: 'Altura del paciente'
        },
        {
          name: 'Peso',
          type: 'NUMBER',
          required: true,
          description: 'Peso del paciente'
        }
      ]
    )

    templateId3 = await createTestPatientTemplate(
      doctor.roleDependentInfo.id,
      `testTemplate3_${Date.now()}`,
      ['General', 'Urgente'],
      [
        {
          name: 'Tipo de Sangre',
          type: 'CHOICE',
          options: ['A+', 'B+', 'O+', 'AB+'],
          required: true,
          description: 'Tipo de sangre del paciente'
        },
        {
          name: 'Alergias',
          type: 'TEXT',
          required: false,
          description: 'Alergias conocidas del paciente'
        }
      ]
    )
  })

  afterAll(async () => {
    await deleteUser(doctor.roleDependentInfo.id)
  })

  // DONE:
  test('should fetch with 200 a list of 3 templates', async () => {
    try {
      const response = await axios.get(REQUEST_URL, {
        params: {
          doctorId: doctor.roleDependentInfo.id
        },
        headers: HEADERS
      })
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('templates')
      expect(response.data.templates.length).toBe(3)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    } catch (error) {
      console.error(
        'Error fetching patient template list:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })

  // DONE:
  test("should fail with 400 to list template if 'doctorId' is not provided", async () => {
    await checkFailListRequest({}, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // DONE:
  test("should fail with 404 to list template if 'doctorid' is not from a active/valid user", async () => {
    const invalidDoctorId = 'invalidDoctorId123'
    await checkFailListRequest(
      {
        doctorId: invalidDoctorId
      },
      404,
      COMMON_MSG.DOCTOR_NOT_FOUND
    )
  })
})
