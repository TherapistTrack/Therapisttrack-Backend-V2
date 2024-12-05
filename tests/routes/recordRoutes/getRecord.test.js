const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../jest.setup')
const {
  createTestDoctor,
  createTestPatientTemplate,
  deleteUser,
  createTestRecord,
  checkFailRequest,
  validateResponse,
  generateObjectId,
  iso8601Regex
} = require('../../testHelpers')
const COMMON_MSG = require('../../errorMsg')
const yup = require('yup')

describe('Get Record by ID', () => {
  let userId, doctorId, secondDoctor, recordId, templateId

  const REQUEST_URL = `${BASE_URL}/records/`

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

    recordId = await createTestRecord(doctorId, templateId, {
      names: 'Juan',
      lastnames: 'Pérez García',
      fields: [
        {
          name: 'Estado Civil',
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
    })
  })

  const recordSchema = yup.object().shape({
    status: yup.number().required().oneOf([200]),
    message: yup.string().required().oneOf([COMMON_MSG.REQUEST_SUCCESS]),
    recordId: yup.string().required(),
    templateId: yup.string().required(),
    categories: yup.array().of(yup.string()).required(),
    createdAt: yup
      .string()
      .matches(iso8601Regex)
      .required('Date should be format ISO8601'),
    patient: yup
      .object()
      .shape({
        names: yup.string().required(),
        lastnames: yup.string().required(),
        fields: yup
          .array()
          .of(
            yup.object().shape({
              name: yup.string().required(),
              type: yup
                .string()
                .required()
                .oneOf([
                  'TEXT',
                  'SHORT_TEXT',
                  'NUMBER',
                  'FLOAT',
                  'CHOICE',
                  'DATE'
                ]),
              options: yup.array().of(yup.string()).optional(),
              value: yup.mixed(),
              required: yup.boolean().required()
            })
          )
          .required()
      })
      .required()
  })

  afterAll(async () => {
    await Promise.all([deleteUser(userId), deleteUser(secondDoctor.id)])
  })

  // TODO:
  test('should succeed with 200 fetching a valid record', async () => {
    try {
      const response = await axios.get(REQUEST_URL, {
        headers: HEADERS,
        params: {
          recordId: recordId,
          doctorId: doctorId
        }
      })

      expect(response.status).toBe(200)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
      await validateResponse(response.data, recordSchema)
    } catch (error) {
      console.error(
        'Error fetching record:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })

  // TODO:
  test('should fail with 400 if doctorId is not sent', async () => {
    await checkFailGetRequest({ recordId }, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test('should fail with 400 if recordId is not sent', async () => {
    await checkFailGetRequest({ doctorId }, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test('should fail with 403 if doctor is not the owner of the record', async () => {
    await checkFailGetRequest(
      {
        recordId,
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
        recordId,
        doctorId: nonExistentDoctorId
      },
      404,
      COMMON_MSG.DOCTOR_NOT_FOUND
    )
  })

  // TODO:
  test('should fail with 404 if recordId is from a non-existent record', async () => {
    const nonExistentRecordId = generateObjectId()

    await checkFailGetRequest(
      {
        recordId: nonExistentRecordId,
        doctorId: doctorId
      },
      404,
      COMMON_MSG.RECORD_NOT_FOUND
    )
  })
})
