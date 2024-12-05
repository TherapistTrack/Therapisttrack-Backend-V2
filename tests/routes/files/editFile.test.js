const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../jest.setup')
const COMMON_MSG = require('../../errorMsg')

const {
  generateObjectId,
  deleteUser,
  checkFailRequest,
  setUpEnvironmentForFilesTests,
  createTestFile,
  createTestDoctor,
  modifyObjectAttribute,
  modifyObjectArray,
  deleteObjectAttribute
} = require('../../testHelpers')

describe('Edit Files Tests', () => {
  let doctor, secondDoctor, fileId

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
    fileId: '',
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

  function modifyFileAttribute(attributePath, newValue) {
    return modifyObjectAttribute(BASE_FILE, attributePath, newValue)
  }

  function modifyFileField(fieldName, newValue) {
    return modifyObjectArray(BASE_FILE, `fields`, (field) => {
      if (field.name === fieldName) field.value = newValue
      return field
    })
  }

  function deleteFileAttribute(attributePath) {
    return deleteObjectAttribute(BASE_FILE, attributePath)
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
    /*
    BASE_FILE.doctorId = '673682619176c55f7d69992a'
    BASE_FILE.recordId = '673682619176c55f7d699935'
    BASE_FILE.templateId = '673682619176c55f7d699931'
    fileId = "673682629176c55f7d699939"
    */
    BASE_FILE.fileId = fileId
    // console.log(JSON.stringify(BASE_FILE, "", "  "))
  })

  afterAll(async () => {
    // await deleteUser(doctor.id)
  })

  // DONE:
  test('should succeed with 200 editing a record', async () => {
    const fileEditBody = {
      doctorId: BASE_FILE.doctorId,
      fileId: BASE_FILE.fileId,
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
          value: 334
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
    // console.log(JSON.stringify(fileEditBody, '', '  '))

    try {
      const response = await axios.put(REQUEST_URL, fileEditBody, {
        headers: HEADERS
      })

      expect(response.status).toBe(200)
      console.log(response.data)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    } catch (error) {
      console.error(
        'Error editing file:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })

  // DONE:
  test('should fail with 400 if doctorId is not passed', async () => {
    const file = deleteFileAttribute('doctorId')
    await checkFailEditRequest(file, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // DONE:
  test('should fail with 400 if fileId is not passed', async () => {
    const file = deleteFileAttribute('doctorId')
    await checkFailEditRequest(file, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // DONE:
  test('should fail with 400 if name is not passed', async () => {
    const file = deleteFileAttribute('name')
    await checkFailEditRequest(file, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // DONE:
  test('should fail with 400 if category is not passed', async () => {
    const file = deleteFileAttribute('name')
    await checkFailEditRequest(file, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // DONE:
  test('should fail with 400 if fields is not passed', async () => {
    const file = deleteFileAttribute('fields')
    await checkFailEditRequest(file, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // DONE:
  test('should fail with 403 if doctor is not the owner', async () => {
    const file = modifyFileAttribute(
      'doctorId',
      secondDoctor.roleDependentInfo.id
    )
    await checkFailEditRequest(file, 403, COMMON_MSG.DOCTOR_IS_NOT_OWNER)
  })

  // DONE:
  test('should fail with 404 if doctorId is from a non-existent/active user', async () => {
    const file = modifyFileAttribute('doctorId', generateObjectId())
    await checkFailEditRequest(file, 404, COMMON_MSG.DOCTOR_NOT_FOUND)
  })

  // DONE:
  test('should fail with 404 if fileId is from a non-existent record', async () => {
    const file = modifyFileAttribute('fileId', generateObjectId())
    await checkFailEditRequest(file, 404, COMMON_MSG.FILE_NOT_FOUND)
  })

  // ==================
  // === TEXT ===
  // ==================
  // DONE:
  test('should fail with 405 when passing NUMBER value for TEXT field', async () => {
    const file = modifyFileField('Notas adicionales', 123)
    console.log(JSON.stringify(file, '', '  '))
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_TEXT)
  })

  // DONE:
  test('should fail with 405 when passing BOOLEAN value for TEXT field', async () => {
    const file = modifyFileField('Notas adicionales', true)
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_TEXT)
  })

  // DONE:
  test('should fail with 405 when passing ARRAY value for TEXT field', async () => {
    const file = modifyFileField('Notas adicionales', [])
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_TEXT)
  })

  // ==================
  // === SHORT_TEXT ===
  // ==================
  // DONE:
  test('should fail with 405 when passing NUMBER value for SHORT_TEXT field', async () => {
    const file = modifyFileField('Instrucciones de administracion', 123)
    await checkFailEditRequest(
      file,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_SHORT_TEXT
    )
  })

  // DONE:
  test('should fail with 405 when passing BOOLEAN value for SHORT_TEXT field', async () => {
    const file = modifyFileField('Instrucciones de administracion', true)
    await checkFailEditRequest(
      file,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_SHORT_TEXT
    )
  })

  // DONE:
  test('should fail with 405 when passing ARRAY value for SHORT_TEXT field', async () => {
    const file = modifyFileField('Instrucciones de administracion', true)
    await checkFailEditRequest(
      file,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_SHORT_TEXT
    )
  })

  // ==================
  // === NUMBER ===
  // ==================
  // DONE:
  test('should fail with 405 when passing TEXT value for NUMBER field', async () => {
    const file = modifyFileField('Dosis (mg)', '123')
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_NUMBER)
  })

  // DONE:
  test('should fail with 405 when passing BOOLEAN value for NUMBER field', async () => {
    const file = modifyFileField('Dosis (mg)', true)
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_NUMBER)
  })

  // DONE:
  test('should fail with 405 when passing ARRAY value for NUMBER field', async () => {
    const file = modifyFileField('Dosis (mg)', [])
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_NUMBER)
  })

  // DONE:
  test('should fail with 405 when passing FLOAT value for NUMBER field', async () => {
    // Number field just accepts integers
    const file = modifyFileField('Dosis (mg)', 32.2)
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_NUMBER)
  })

  // ==================
  // === FLOAT ===
  // ==================
  // DONE:
  test('should fail with 405 when passing TEXT value for FLOAT field', async () => {
    const file = modifyFileField('Concentracion', '12.5')
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_FLOAT)
  })

  // DONE:
  test('should fail with 405 when passing BOOLEAN value for FLOAT field', async () => {
    const file = modifyFileField('Concentracion', true)
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_FLOAT)
  })

  // DONE:
  test('should fail with 405 when passing ARRAY value for FLOAT field', async () => {
    const file = modifyFileField('Concentracion', [])
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_FLOAT)
  })

  // ==================
  // === CHOICE =======
  // ==================
  // DONE:
  test('should fail with 405 when passing NUMBER values to CHOICE', async () => {
    const file = modifyFileField('Forma de dosis', 32)
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_CHOICE)
  })

  // DONE:
  test('should fail with 405 when passing BOOLEAN values to CHOICE', async () => {
    const file = modifyFileField('Forma de dosis', true)
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_CHOICE)
  })

  // DONE:
  test('should fail with 405 when passing VALUE that is not within CHOICE value', async () => {
    const file = modifyFileField('Forma de dosis', 'camello')
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_CHOICE)
  })

  // DONE:
  test('should fail with 405 when passing ARRAY value for CHOICE field', async () => {
    const file = modifyFileField('Forma de dosis', [])
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_CHOICE)
  })

  // ==================
  // === DATE =======
  // ==================
  // DONE:
  test('should fail with 405 when passing TEXT value for DATE field', async () => {
    const file = modifyFileField('Fecha de preescripcion', 'hola')
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_DATE)
  })

  // DONE:
  test('should fail with 405 when passing BOOLEAN value for DATE field', async () => {
    const file = modifyFileField('Fecha de preescripcion', true)
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_DATE)
  })

  // DONE:
  test('should fail with 405 when passing NUMBER value for DATE field', async () => {
    const file = modifyFileField('Fecha de preescripcion', 32)
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_DATE)
  })

  // DONE:
  test('should fail with 405 when passing ARRAY value for DATE field', async () => {
    const file = modifyFileField('Fecha de preescripcion', [])
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_DATE)
  })

  // DONE:
  test('should fail with 405 when passing date not in ISO8601 format for DATE field', async () => {
    const file = modifyFileField('Fecha de preescripcion', '23/3/2024')
    await checkFailEditRequest(file, 405, COMMON_MSG.INVALID_FIELD_TYPE_DATE)
  })
})
