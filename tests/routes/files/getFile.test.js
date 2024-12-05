const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../jest.setup')
const {
  createTestDoctor,
  deleteUser,
  checkFailRequest,
  validateResponse,
  createTestFile,
  iso8601Regex,
  setUpEnvironmentForFilesTests,
  generateObjectId
} = require('../../testHelpers')
const COMMON_MSG = require('../../errorMsg')
const yup = require('yup')

describe('Get Record by ID', () => {
  let doctor, secondDoctor, recordId, fileTemplateId, fileId

  const REQUEST_URL = `${BASE_URL}/files/`

  const HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  const BASE_FILE = {
    doctorId: '', // Will be filled on the beforaAll()
    recordId: '',
    templateId: '',
    name: 'test_file',
    category: 'consultas',
    fields: [
      {
        name: 'Notas adicionales',
        value: 'nota 1'
      },
      {
        name: 'Instrucciones de administracion',
        value: 'tomar oralmente'
      },
      {
        name: 'Dosis (mg)',
        value: 32
      },
      {
        name: 'Concentracion',
        value: 3.0
      },
      {
        name: 'Forma de dosis',
        value: 'Oral'
      },
      {
        name: 'Fecha de preescripcion',
        value: '2024-11-13T14:30:00Z'
      }
    ]
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
    secondDoctor = await createTestDoctor()
    ;({ doctor, recordId, fileTemplateId } =
      await setUpEnvironmentForFilesTests(
        ['consultas', 'tests'],
        `template_${Date.now()}`,
        [
          {
            name: 'Notas adicionales',
            type: 'TEXT',
            required: true,
            description: '_'
          },
          {
            name: 'Instrucciones de administracion',
            type: 'SHORT_TEXT',
            required: true,
            description: '_'
          },
          {
            name: 'Dosis (mg)',
            type: 'NUMBER',
            required: true,
            description: '_'
          },
          {
            name: 'Concentracion',
            type: 'FLOAT',
            required: true,
            description: '_'
          },
          {
            name: 'Forma de dosis',
            type: 'CHOICE',
            options: ['Oral', 'Capsula'],
            required: true,
            description: '_'
          },
          {
            name: 'Fecha de preescripcion',
            type: 'DATE',
            required: true,
            description: '_'
          }
        ]
      ))

    BASE_FILE.doctorId = doctor.roleDependentInfo.id
    BASE_FILE.recordId = recordId
    BASE_FILE.templateId = fileTemplateId
    fileId = await createTestFile(BASE_FILE)
    BASE_FILE.fileId = fileId
  })
  afterAll(async () => {
    await Promise.all([deleteUser(doctor.id), deleteUser(secondDoctor.id)])
  })

  const FILE_SCHEMA = yup.object().shape({
    status: yup.number().required().oneOf([200]),
    message: yup.string().required().oneOf([COMMON_MSG.REQUEST_SUCCESS]),
    fileId: yup.string().required(),
    recordId: yup.string().required(),
    templateId: yup.string().required(),
    name: yup.string().required(),
    category: yup.string().required(),
    createdAt: yup
      .string()
      .matches(iso8601Regex)
      .required('Date should be format ISO8601'),
    pages: yup.number().required(),
    fields: yup.array().of(
      yup.object().shape({
        name: yup.string().required(),
        type: yup
          .string()
          .required()
          .oneOf(['TEXT', 'SHORT_TEXT', 'NUMBER', 'FLOAT', 'CHOICE', 'DATE']),
        options: yup
          .array()
          .of(yup.string())
          .optional('options should not be an empty array'),
        value: yup.mixed(),
        required: yup.boolean().required()
      })
    )
  })

  // TODO:
  test('should succeed with 200 fetching a valid record', async () => {
    try {
      const response = await axios.get(REQUEST_URL, {
        headers: HEADERS,
        params: {
          fileId: fileId,
          doctorId: doctor.roleDependentInfo.id
        }
      })

      expect(response.status).toBe(200)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
      await validateResponse(response.data, FILE_SCHEMA)
    } catch (error) {
      console.error(
        'Error fetching metadata:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })

  // TODO:
  test('should fail with 400 if doctorId is not sent', async () => {
    await checkFailGetRequest({ fileId }, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test('should fail with 400 if fileId is not sent', async () => {
    await checkFailGetRequest(
      { doctorId: doctor.roleDependentInfo.id },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // TODO:
  test('should fail with 403 if doctor is not the owner of the file', async () => {
    await checkFailGetRequest(
      {
        fileId,
        doctorId: secondDoctor.roleDependentInfo.id
      },
      403,
      COMMON_MSG.DOCTOR_IS_NOT_OWNER
    )
  })

  // TODO:
  test('should fail with 404 if doctorId is from a non-existent/disable user', async () => {
    const nonExistentDoctorId = generateObjectId()

    await checkFailGetRequest(
      {
        fileId,
        doctorId: nonExistentDoctorId
      },
      404,
      COMMON_MSG.DOCTOR_NOT_FOUND
    )
  })

  // TODO:
  test('should fail with 404 if fileId is from a non-existent file', async () => {
    const nonExistentRecordId = generateObjectId()

    await checkFailGetRequest(
      {
        fileId: nonExistentRecordId,
        doctorId: doctor.roleDependentInfo.id
      },
      404,
      COMMON_MSG.FILE_NOT_FOUND
    )
  })
})
