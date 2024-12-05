const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../../jest.setup')
const {
  createTestDoctor,
  deleteUser,
  createTestPatientTemplate,
  checkFailRequest
} = require('../../../testHelpers')
const COMMON_MSG = require('../../../errorMsg')

describe('Edit Field from Patient Template Tests', () => {
  let doctor, secondDoctor, templateId

  const REQUEST_URL = `${BASE_URL}/doctor/PatientTemplate/fields`

  const HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  async function checkFailEditRequest(body, expectedCode, expectedMsg) {
    return checkFailRequest(
      'put',
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

    templateId = await createTestPatientTemplate(
      doctor.roleDependentInfo.id,
      `testTemplate_${Date.now()}`,
      ['General'],
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
  test('should fail with 400 to edit a field without templateID', async () => {
    await checkFailEditRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        oldFieldName: 'Edad',
        fieldData: {
          name: 'Edad',
          type: 'NUMBER',
          required: true,
          description: 'Edad del paciente'
        }
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test('should fail with 400 to edit a field without doctorId', async () => {
    await checkFailEditRequest(
      {
        templateId: doctor.roleDependentInfo.id,
        oldFieldName: 'Edad',
        fieldData: {
          name: 'Edad',
          type: 'NUMBER',
          required: true,
          description: 'Edad del paciente'
        }
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test('should fail with 400 to edit a field without oldFieldName', async () => {
    await checkFailEditRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        templateId: templateId,
        fieldData: {
          name: 'Edad',
          type: 'NUMBER',
          required: true,
          description: 'Edad del paciente'
        }
      },
      400,
      COMMON_MSG.MISSING_FIELDS
    )
  })

  // DONE:
  test('should fail with 403 if doctor is not template owner', async () => {
    await checkFailEditRequest(
      {
        doctorId: secondDoctor.roleDependentInfo.id,
        templateId: templateId,
        oldFieldName: 'Edad',
        fieldData: {
          name: 'Edad',
          type: 'NUMBER',
          required: true,
          description: 'Edad del paciente'
        }
      },
      403,
      COMMON_MSG.DOCTOR_IS_NOT_OWNER
    )
  })

  // DONE:
  test('should fail with 404 if doctorid is from a not existent/valid user', async () => {
    await checkFailEditRequest(
      {
        doctorId: 'notExistentDoctor',
        templateId: templateId,
        oldFieldName: 'Edad',
        fieldData: {
          name: 'Edad',
          type: 'NUMBER',
          required: true,
          description: 'Edad del paciente'
        }
      },
      404,
      COMMON_MSG.DOCTOR_NOT_FOUND
    )
  })

  // DONE:
  test('should fail with 404 if templateid is from a not existent/valid template', async () => {
    await checkFailEditRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        templateId: 'notExistentTemplate',
        oldFieldName: 'Edad',
        fieldData: {
          name: 'Edad',
          type: 'NUMBER',
          required: true,
          description: 'Edad del paciente'
        }
      },
      404,
      COMMON_MSG.TEMPLATE_NOT_FOUND
    )
  })

  // DONE:
  test('should fail with 404 if oldfieldName is from a not existent/valid field', async () => {
    await checkFailEditRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        templateId: templateId,
        oldFieldName: 'notExistentField',
        fieldData: {
          name: 'Edad',
          type: 'NUMBER',
          required: true,
          description: 'Edad del paciente'
        }
      },
      404,
      COMMON_MSG.FIELD_NOT_FOUND
    )
  })

  // DONE:
  test('should fail with 406 to rename a field to a field that already has that name', async () => {
    await checkFailEditRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        templateId: templateId,
        oldFieldName: 'Edad',
        fieldData: {
          name: 'Estado Civil',
          options: [],
          required: true,
          description: 'Apellido del paciente'
        }
      },
      406,
      COMMON_MSG.RECORDS_USING
    )
  })

  // DONE:
  test("should fail with 400 to rename field to 'Nombres' since its a reserved name", async () => {
    await checkFailEditRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        templateId: templateId,
        oldFieldName: 'Edad',
        fieldData: {
          name: 'Nombres',
          options: [],
          required: true,
          description: 'Nombre del paciente'
        }
      },
      400,
      COMMON_MSG.RESERVED_FIELD_NAMES
    )
  })

  // DONE:
  test("should fail with 400 to rename field to 'Apellidos' since its a reserved name", async () => {
    await checkFailEditRequest(
      {
        doctorId: doctor.roleDependentInfo.id,
        templateId: templateId,
        oldFieldName: 'Edad',
        fieldData: {
          name: 'Apellidos',
          options: [],
          required: true,
          description: 'Apellido del paciente'
        }
      },
      400,
      COMMON_MSG.RESERVED_FIELD_NAMES
    )
  })

  // TODO: test edit property that is already atached to real records.
  //
  // DONE:
  test('should edit with 200 the name of an existing field in a patient template', async () => {
    const fieldToEdit = {
      doctorId: doctor.roleDependentInfo.id,
      templateId: templateId,
      oldFieldName: 'Edad',
      fieldData: {
        name: 'Edad Actualizada',
        type: 'NUMBER',
        required: true,
        description: 'Edad actualizada del paciente'
      }
    }

    try {
      const response = await axios.put(REQUEST_URL, fieldToEdit, {
        headers: HEADERS
      })
      expect(response.status).toBe(200)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    } catch (error) {
      console.error(
        'Error editing field:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })

  // DONE:
  test('should edit with 200 an existing field to change required status', async () => {
    const fieldToEdit = {
      doctorId: doctor.roleDependentInfo.id,
      templateId: templateId,
      oldFieldName: 'Edad Actualizada',
      fieldData: {
        name: 'Edad Actualizada',
        type: 'NUMBER',
        required: false, // Cambiar "Edad" a no obligatorio
        description: 'Edad no obligatoria del paciente'
      }
    }

    try {
      const response = await axios.put(REQUEST_URL, fieldToEdit, {
        headers: HEADERS
      })
      expect(response.status).toBe(200)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    } catch (error) {
      console.error(
        'Error editing field:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })
})
