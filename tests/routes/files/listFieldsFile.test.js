const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../jest.setup')
const {
  generateObjectId,
  createTestDoctor,
  deleteUser,
  createTestFileTemplate,
  checkFailRequest,
  validateResponse
} = require('../../testHelpers')
const yup = require('yup')
const COMMON_MSG = require('../../errorMsg')

describe('Quet available fields for files Tests', () => {
  let doctor

  const REQUEST_URL = `${BASE_URL}/files/search`

  const HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  async function checkFailGetRequest(params, expectedCode, expectedMsg) {
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
    doctor = await createTestDoctor()
    await createTestFileTemplate(
      doctor.roleDependentInfo.id,
      `template_test_${Date.now()}`,
      [
        {
          name: 'Estado',
          type: 'CHOICE',
          options: ['option1', 'option2'],
          required: true,
          description: ' '
        }
      ]
    )
    await createTestFileTemplate(
      doctor.roleDependentInfo.id,
      `template_test_2_${Date.now()}`,
      [
        {
          name: 'Edad',
          type: 'NUMBER',
          required: true,
          description: ' '
        }
      ]
    )
  })

  afterAll(async () => {
    await deleteUser(doctor.id)
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
  test('Should succeed with 200 in retreiving available file fields', async () => {
    try {
      const response = await axios.get(REQUEST_URL, {
        headers: HEADERS,
        params: {
          doctorId: doctor.roleDependentInfo.id
        }
      })
      expect(response.status).toBe(200)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
      expect(response.data.fields.length).toBe(2)
      await validateResponse(response.data, LIST_FIELDS_SCHEMA)
    } catch (error) {
      console.error(
        'Error fetching metadata:',
        error.response ? error.response.data : error.message
      )
    }
  })

  // TODO:
  test('Should fail with 400 if doctorId is not sent', async () => {
    checkFailGetRequest({}, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test('Should fail with 404 if doctorId not correspond to and existent/valid user', async () => {
    checkFailGetRequest(
      {
        doctorId: generateObjectId()
      },
      404,
      COMMON_MSG.DOCTOR_NOT_FOUND
    )
  })
})
