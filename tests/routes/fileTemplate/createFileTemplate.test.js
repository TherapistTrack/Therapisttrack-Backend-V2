const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../jest.setup')
const {
  createTestDoctor,
  deleteUser,
  checkFailRequest
} = require('../../testHelpers')
const COMMON_MSG = require('../../errorMsg')

describe('Create File Template Tests', () => {
  let userId, doctorId

  const REQUEST_URL = `${BASE_URL}/doctor/FileTemplate`

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
    const doctor = await createTestDoctor()
    userId = doctor.id
    doctorId = doctor.roleDependentInfo.id
  })

  afterAll(async () => {
    await deleteUser(userId)
  })

  // DONE:
  test('should create a new file template correctly with all required fields', async () => {
    console.log('doctorId:', doctorId)
    const testTemplate = {
      doctorId: doctorId,
      name: `testTemplate`,
      fields: [
        {
          name: 'Edad',
          type: 'NUMBER',
          description: 'Edad del paciente',
          required: true
        },
        {
          name: 'Hijos',
          type: 'TEXT',
          description: 'Hijos del paciente',
          required: true
        },
        {
          name: 'Estado Civil',
          type: 'CHOICE',
          options: ['Soltero', 'Casado'],
          description: 'Estado civil del paciente',
          required: true
        },
        {
          name: 'Fecha de Nacimiento',
          type: 'DATE',
          description: 'Fecha de Nacimiento del paciente',
          required: false
        }
      ]
    }

    try {
      const response = await axios.post(REQUEST_URL, testTemplate, {
        headers: HEADERS
      })
      expect(response.status).toBe(201) // Comprobamos que se creó correctamente
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
      templateId = response.data.data.fileTemplateId
    } catch (error) {
      console.error(
        'Error creating template:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })

  // DONE:
  test('should fail with 400 to create a file template without the doctorId', async () => {
    await checkFailCreateRequest(
      {
        name: `testTemplate_${Date.now()}`,
        fields: [
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
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test('should trigger a 400 when passed a malformed fields list', async () => {
    await checkFailCreateRequest(
      {
        doctorId: doctorId,
        name: `testTemplate_${Date.now()}`,
        fields: 'This should be an array, not a string'
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test('should fail with 400 with CHOICE field but not options attribute defined', async () => {
    await checkFailCreateRequest(
      {
        doctorId: doctorId,
        name: `testTemplate_${Date.now()}`,
        fields: [
          {
            name: 'Edad',
            type: 'NUMBER',
            required: true,
            description: 'Edad del paciente'
          },
          {
            name: 'Estado Civil',
            type: 'CHOICE',
            required: true,
            description: 'Estado civil del paciente'
          }
        ]
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test('should fail with 404 to create a file template with a non-existent doctorId', async () => {
    await checkFailCreateRequest(
      {
        doctorId: 'nonExistentDoctorId',
        name: `testTemplate_${Date.now()}`,
        fields: [
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
      },
      404,
      COMMON_MSG.DOCTOR_NOT_FOUND
    )
  })

  // DONE:
  test('should fail with 406 when creating a file template with an existing name', async () => {
    await checkFailCreateRequest(
      {
        doctorId: doctorId,
        name: 'testTemplate',
        fields: [
          {
            name: 'Edad',
            type: 'NUMBER',
            required: true,
            description: 'Edad del paciente'
          }
        ]
      },
      406,
      COMMON_MSG.RECORDS_USING
    )
  })

  // DONE:
  test('should fail with 400 when creating file with two fields that have the same name', async () => {
    await checkFailCreateRequest(
      {
        doctorId: doctorId,
        name: 'testTemplate',
        fields: [
          {
            name: 'Edad',
            type: 'NUMBER',
            required: true,
            description: 'Edad del paciente'
          },
          {
            name: 'Edad',
            type: 'FLOAT',
            required: true,
            description: 'Edad del paciente'
          }
        ]
      },
      400,
      COMMON_MSG.DUPLICATE_FIELD_NAMES
    )
  })

  //DONE:
  test('should fail with 400 to create a file template with two or more duplicate fields', async () => {
    await checkFailCreateRequest(
      {
        doctorId: doctorId,
        name: `testTemplate_${Date.now()}`,
        fields: [
          {
            name: 'Edad',
            type: 'NUMBER',
            required: true,
            description: 'Edad del paciente'
          },
          {
            name: 'Edad',
            type: 'NUMBER',
            required: true,
            description: 'Edad del paciente'
          }
        ]
      },
      400,
      COMMON_MSG.DUPLICATE_FIELD_NAMES
    )
  })

  /* Para endPonintRecords
  // Test para validar tipos de datos incorrectos en los campos
  test('should fail to create a  template with incorrect data types', async () => {
    const testTemplate = {
      doctorId: doctorId,
      name: `testTemplate_${Date.now()}`,
      patientTemplate: {
        record: '12345',
        names: 'Plantilla-2024',
        fields: [
          { name: 'Nombres', type: 'SHORT_TEXT', required: true }, // Texto Corto
          { name: 'Apellidos', type: 'SHORT_TEXT', required: true }, // Texto Corto
          {
            name: 'Edad',
            type: 'NUMBER',
            required: true,
            value: 'not-a-number'
          }, // Error: texto en lugar de número
          {
            name: 'Estado Civil',
            type: 'CHOICE',
            options: ['Soltero', 'Casado'],
            required: true
          }
        ]
      }
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/templates/create`,
        testTemplate,
        { headers }
      )
    } catch (error) {
      expect(error.response.status).toBe(400)
      expect(error.response.data.message).toBe('Tipo de dato incorrecto')
    }
  })
  */
})
