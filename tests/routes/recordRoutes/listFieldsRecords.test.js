const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../jest.setup')
const {
  createTestDoctor,
  createTestPatientTemplate,
  deleteUser,
  checkFailRequest,
  validateResponse,
  generateObjectId
} = require('../../testHelpers')
const COMMON_MSG = require('../../errorMsg')
const yup = require('yup')

describe('List possible fields', () => {
  let doctorId, userId

  const REQUEST_URL = `${BASE_URL}/records/search`

  const HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  async function checkFailListRequest(params, expectedCode, expectedMsg) {
    return checkFailRequest(
      'get',
      REQUEST_URL,
      HEADERS,
      params,
      {},
      expectedCode,
      expectedMsg
    )
  }

  beforeAll(async () => {
    const doctor = await createTestDoctor()
    userId = doctor.id
    doctorId = doctor.roleDependentInfo.id

    await createTestPatientTemplate(
      doctorId,
      `Plantilla de Prueba_${Date.now()}`,
      ['General'],
      [
        {
          name: 'Age',
          type: 'NUMBER',
          required: true,
          description: 'Edad del paciente'
        }
      ]
    )
    await createTestPatientTemplate(
      doctorId,
      `Plantilla de Prueba 2_${Date.now()}`,
      ['General'],
      [
        {
          name: 'Tests',
          type: 'NUMBER',
          required: true,
          description: 'Edad del paciente'
        }
      ]
    )
  })

  afterAll(async () => {
    await deleteUser(userId)
  })

  const LIST_FIELDS_SCHEMA = yup.object().shape({
    status: yup.number().required().oneOf([200]),
    message: yup.string().required().oneOf([COMMON_MSG.REQUEST_SUCCESS]),
    fields: yup
      .array()
      .of(
        yup.object().shape({
          name: yup.string().required(),
          type: yup
            .string()
            .required()
            .oneOf(['TEXT', 'SHORT_TEXT', 'NUMBER', 'FLOAT', 'CHOICE', 'DATE'])
        })
      )
      .required()
  })

  // TODO:
  test('Should succeed with 200 in retreiving available record fields', async () => {
    try {
      const response = await axios.get(REQUEST_URL, {
        headers: HEADERS,
        params: {
          doctorId: doctorId
        }
      })

      await validateResponse(response.data, LIST_FIELDS_SCHEMA)
      expect(response.status).toBe(200)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
      expect(response.data.fields.length).toBe(2)
    } catch (error) {
      console.error(
        'Error retrieving available record fields:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })

  // TODO:
  test('Should fail with 404 if doctorId not correspond to and existent/valid user', async () => {
    const nonExistentDoctorId = 'nonExistentDoctorId12345'

    await checkFailListRequest(
      { doctorId: generateObjectId() },
      404,
      COMMON_MSG.DOCTOR_NOT_FOUND
    )
  })

  // TODO:
  test('Should fail with 400 if doctorId is not sent', async () => {
    await checkFailListRequest({}, 400, COMMON_MSG.MISSING_FIELDS)
  })
})
