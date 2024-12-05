const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../../jest.setup')
const {
  createTestDoctor,
  deleteUser,
  createTestFileTemplate,
  checkFailRequest
} = require('../../../testHelpers')
const COMMON_MSG = require('../../../errorMsg')

describe('Create File Template Field Tests', () => {
  let doctor, secondDoctor, templateId

  const REQUEST_URL = `${BASE_URL}/doctor/FileTemplate/fields`

  const HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  async function checkFailCreateRequest(body, expectedCode, expectedMsg) {
    return checkFailRequest(
      'post',
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
  test('should success with 200 add a new field to an existing file template', async () => {
    const fieldToAdd = {
      doctorId: doctor.roleDependentInfo.id,
      templateId: templateId, // Usar el ID de la plantilla creada
      field: {
        name: 'Numero de Telefono', // Campo nuevo 'Phone Number'
        type: 'NUMBER',
        required: true,
        description: 'Teléfono de contacto del paciente'
      }
    }

    try {
      const response = await axios.post(REQUEST_URL, fieldToAdd, {
        headers: HEADERS
      })
      expect(response.status).toBe(200) // El backend debería devolver un estado 200
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS) // Mensaje esperado
    } catch (error) {
      console.error(
        'Error adding field:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })

  // DONE:
  test('should fail with 400 if templateID not passed', async () => {
    await checkFailCreateRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        field: {
          name: 'Allergies',
          type: 'TEXT',
          value: '',
          required: false,
          description: "Patient's known allergies"
        }
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test('should fail with 400 if doctorId not passed ', async () => {
    await checkFailCreateRequest(
      {
        templateId: templateId,
        field: {
          name: 'Allergies',
          type: 'TEXT',
          value: '',
          required: false,
          description: "Patient's known allergies"
        }
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test('should fail with 403 if doctor is not the owner of the template', async () => {
    await checkFailCreateRequest(
      {
        doctorId: secondDoctor.roleDependentInfo.id, // Doctor incorrecto
        templateId: templateId,
        field: {
          name: 'Phone Number',
          type: 'NUMBER',
          required: true,
          description: 'Teléfono del paciente'
        }
      },
      403,
      COMMON_MSG.DOCTOR_IS_NOT_OWNER
    )
  })

  // DONE:
  test('should fail with 404 if doctorId is form a non active/valid user ', async () => {
    await checkFailCreateRequest(
      {
        doctorId: 'invalidDoctorId', // Doctor incorrecto
        templateId: templateId,
        field: {
          name: 'Phone Number',
          type: 'NUMBER',
          required: true,
          description: 'Teléfono del paciente'
        }
      },
      404,
      COMMON_MSG.DOCTOR_NOT_FOUND
    )
  })

  // DONE:
  test('should fail with 404 if templateId does not exist ', async () => {
    await checkFailCreateRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        templateId: 'nonExistentTemplate',
        field: {
          name: 'Phone Number',
          type: 'NUMBER',
          required: true,
          description: 'Teléfono del paciente'
        }
      },
      404,
      COMMON_MSG.TEMPLATE_NOT_FOUND
    )
  })

  // DONE:
  test('should fail with 406 due to name alredy exist in template', async () => {
    await checkFailCreateRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        templateId: templateId,
        field: {
          name: 'Edad',
          type: 'NUMBER',
          required: true,
          description: 'Edad del paciente'
        }
      },
      406,
      COMMON_MSG.RECORDS_USING
    )
  })
})
