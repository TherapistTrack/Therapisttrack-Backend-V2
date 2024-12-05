const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../jest.setup')
const {
  createTestFile,
  checkFailRequest,
  setUpEnvironmentForFilesTests,
  modifyObjectAttribute,
  buildSearchRequestBody,
  buildFilterObject,
  iso8601Regex,
  deleteObjectAttribute,
  validateResponse,
  deleteUser
} = require('../../testHelpers')
const COMMON_MSG = require('../../errorMsg')
const yup = require('yup')

describe('Search Files endpoint', () => {
  let doctor, doctorId, patientTemplateId, recordId, fileTemplateId
  const REQUEST_URL = `${BASE_URL}/files/search`

  const HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  const BASE_REQUEST = {
    doctorId: '',
    recordId: '',
    limit: 10,
    page: 0,
    category: '',
    fields: [
      {
        name: 'Edad',
        type: 'NUMBER'
      },
      {
        name: 'Fecha de nacimiento',
        type: 'DATE'
      },
      {
        name: 'Estado civil',
        type: 'CHOICE'
      }
    ],
    sorts: [],
    filters: []
  }

  beforeAll(async () => {
    ;({ doctor, patientTemplateId, recordId, fileTemplateId } =
      await setUpEnvironmentForFilesTests(
        ['consultas', 'tests'],
        `template_test_${Date.now()}`,
        [
          {
            name: 'A',
            type: 'TEXT',
            required: true,
            description: '_'
          },
          {
            name: 'B',
            type: 'SHORT_TEXT',
            required: true,
            description: '_'
          },
          {
            name: 'C',
            type: 'NUMBER',
            required: true,
            description: '_'
          },
          {
            name: 'D',
            type: 'FLOAT',
            required: true,
            description: '_'
          },
          {
            name: 'E',
            type: 'CHOICE',
            options: ['a', 'b'],
            required: true,
            description: '_'
          },
          {
            name: 'F',
            type: 'DATE',
            required: true,
            description: '_'
          }
        ]
      ))
    BASE_REQUEST.doctorId = doctor.roleDependentInfo.id
    BASE_REQUEST.recordId = recordId
    doctorId = doctor.roleDependentInfo.id

    // Crear varios registros asociados a la plantilla para realizar las pruebas
    await createTestFile({
      doctorId: doctor.roleDependentInfo.id,
      recordId,
      templateId: fileTemplateId,
      name: 'file1',
      category: 'consultas',
      fields: [
        { name: 'A', value: 'a' },
        { name: 'B', value: 'a' },
        { name: 'C', value: 12 },
        { name: 'D', value: 100.1 },
        { name: 'E', value: 'a' },
        { name: 'F', value: '1993-07-15T00:00:00Z' }
      ]
    })

    await createTestFile({
      doctorId: doctor.roleDependentInfo.id,
      recordId,
      templateId: fileTemplateId,
      name: 'file2',
      category: 'consultas',
      fields: [
        { name: 'A', value: 'b' },
        { name: 'B', value: 'b' },
        { name: 'C', value: 13 },
        { name: 'D', value: 25.2 },
        { name: 'E', value: 'a' },
        { name: 'F', value: '1998-03-22T00:00:00Z' }
      ]
    })

    await createTestFile({
      doctorId: doctor.roleDependentInfo.id,
      recordId,
      templateId: fileTemplateId,
      name: 'file3',
      category: 'consultas',
      fields: [
        { name: 'A', value: 'c' },
        { name: 'B', value: 'c' },
        { name: 'C', value: 14 },
        { name: 'D', value: 40.3 },
        { name: 'E', value: 'b' },
        { name: 'F', value: '1982-11-01T00:00:00Z' }
      ]
    })
  })

  afterAll(async () => {
    await deleteUser(doctorId)
  })

  const SEARCH_RESPONSE_SCHEMA = yup
    .object()
    .shape({
      status: yup.number().required().oneOf([200]),
      message: yup.string().required().oneOf([COMMON_MSG.REQUEST_SUCCESS]),
      total: yup.number().required(),
      files: yup
        .array()
        .of(
          yup.object().shape({
            fileId: yup.string().required(),
            templateId: yup.string().required(),
            name: yup.string().required(),
            createdAt: yup.string().matches(iso8601Regex).required(),
            pages: yup.number().required(),
            fields: yup.array().of(
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
                options: yup
                  .array()
                  .of(yup.string())
                  .optional('options should not be an empty array'),
                value: yup.mixed().required(),
                required: yup.boolean().required()
              })
            )
          })
        )
        .required()
    })
    .noUnknown(true)

  async function checkFailSearchRequest(body, expectedCode, expectedMsg) {
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

  // TODO:
  test('should suceed with 200 searching a list of files with no sorting or filtering', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctor.roleDependentInfo.id,
      recordId: recordId,
      limit: 10,
      page: 0,
      category: 'consultas',
      fields: [
        { name: 'C', type: 'NUMBER' },
        { name: 'F', type: 'DATE' },
        { name: 'E', type: 'CHOICE' }
      ],
      filters: [],
      sorts: []
    })

    try {
      const response = await axios.post(REQUEST_URL, searchRequestBody, {
        headers: HEADERS
      })

      expect(response.status).toBe(200)
      validateResponse(response.data, SEARCH_RESPONSE_SCHEMA)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
      expect(response.data.files.length).toBeGreaterThan(0)
      expect(response.data.total).toBe(response.data.files.length)
      response.data.files.forEach((file) => {
        expect(file).toEqual(
          expect.objectContaining({
            fileId: expect.any(String),
            templateId: expect.any(String),
            name: expect.any(String),
            createdAt: expect.any(String),
            pages: expect.any(Number),
            fields: expect.arrayContaining([
              // Check for field "C"
              expect.objectContaining({
                name: 'C',
                type: 'NUMBER',
                value: expect.any(Number),
                required: expect.any(Boolean)
              }),
              // Check for field "F"
              expect.objectContaining({
                name: 'F',
                type: 'DATE',
                value: expect.any(String),
                required: expect.any(Boolean)
              }),
              // Check for field "E"
              expect.objectContaining({
                name: 'E',
                type: 'CHOICE',
                value: expect.any(String),
                options: expect.any(Array),
                required: expect.any(Boolean)
              })
            ])
          })
        )
      })
    } catch (error) {
      console.error(
        'Error searching for list of files:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  })

  /*
  // ===================
  // ==== SORTING
  // ===================
  // TODO:
  test('should suceed with 200 searching a list of files with sorting on SHORT_TEXT field', async () => {})

  // TODO:
  test('should suceed with 200 searching a list of files with sorting on TEXT field', async () => {})

  // TODO:
  test('should suceed with 200 searching a list of files with sorting on NUMBER field', async () => {})

  // TODO:
  test('should suceed with 200 searching a list of files with sorting on FLOAT field', async () => {})

  // TODO:
  test('should suceed with 200 searching a list of files with sorting on DATE field', async () => {})

  // TODO:
  test('should suceed with 200 searching a list of files with sorting on CHOICE field', async () => {})

  // ===================
  // ==== FILTERING
  // ===================
  // TODO:
  test("should suceed with 200 filtering by TEXT field with 'contains'", async () => {})
  // TODO:
  test("should suceed with 200 filtering by TEXT field with 'starts_with'", async () => {})
  // TODO:
  test("should suceed with 200 filtering by TEXT field with 'ends_with'", async () => {})

  // TODO:
  test("should suceed with 200 filtering by SHORT_TEXT field with 'contains'", async () => {})
  // TODO:
  test("should suceed with 200 filtering by SHORT_TEXT field with 'starts_with'", async () => {})
  // TODO:
  test("should suceed with 200 filtering by SHORT_TEXT field with 'ends_with'", async () => {})
  // TODO:
  test("should suceed with 200 filtering by NUMBER field with 'less_than'", async () => {})
  // TODO:
  test("should suceed with 200 filtering by NUMBER field with 'greater_than'", async () => {})
  // TODO:
  test("should suceed with 200 filtering by NUMBER field with 'equal_than'", async () => {})
  // TODO:
  test("should suceed with 200 filtering by FLOAT field with 'less_than'", async () => {})
  // TODO:
  test("should suceed with 200 filtering by FLOAT field with 'less_than'", async () => {})
  // TODO:
  test("should suceed with 200 filtering by FLOAT field with 'less_than'", async () => {})

  // TODO:
  test("should suceed with 200 filtering by DATE field with 'after'", async () => {})
  // TODO:
  test("should suceed with 200 filtering by DATE field with 'before'", async () => {})
  // TODO:
  test("should suceed with 200 filtering by DATE field with 'between'", async () => {})
  // TODO:
  test("should suceed with 200 filtering by CHOICE field with 'is'", async () => {})
  // TODO:
  test("should suceed with 200 filtering by CHOICE field with 'is_not'", async () => {})
  // TODO:
  test("should suceed with 200 filtering by CHOICE field with 'is_not_empty'", async () => {})
  */

  // ====================
  // == ERRORS
  // ===================

  // TODO:
  test('should fail with 400 if doctorId is not sent', async () => {
    const body = deleteObjectAttribute(BASE_REQUEST, 'doctorId')
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test('should fail with 400 if recordId is not sent', async () => {
    const body = deleteObjectAttribute(BASE_REQUEST, 'recordId')
    console.log(body)
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test("should fail with 400 if 'limit' is not sent", async () => {
    const body = deleteObjectAttribute(BASE_REQUEST, 'limit')
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test("should fail with 400 if 'page' is not sent", async () => {
    const body = deleteObjectAttribute(BASE_REQUEST, 'page')
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test("should fail with 400 if 'category' is not sent", async () => {
    const body = deleteObjectAttribute(BASE_REQUEST, 'category')
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test("should fail with 400 if 'fields' array is not sent", async () => {
    const body = deleteObjectAttribute(BASE_REQUEST, 'fields')
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test("should fail with 400 if 'sorts' array is not sent", async () => {
    const body = deleteObjectAttribute(BASE_REQUEST, 'sorts')
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test("should fail with 400 if 'filters' array is not sent", async () => {
    const body = deleteObjectAttribute(BASE_REQUEST, 'sorts')
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test("should fail with 400 if 'fields' items have missing fields", async () => {
    const body = modifyObjectAttribute(BASE_REQUEST, 'fields', [{}])
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test("should fail with 400 if 'sorts' items have missing fields", async () => {
    const body = modifyObjectAttribute(BASE_REQUEST, 'sorts', [{}])
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // TODO:
  test("should fail with 400 if 'filters' items is have missing fields", async () => {
    const body = modifyObjectAttribute(BASE_REQUEST, 'filters', [{}])
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // ==================
  // === TEXT ===
  // ==================
  // DONE:
  test.skip('should fail with 405 when passing NUMBER value for TEXT field in filters', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'A', type: 'TEXT' }],
      filters: [buildFilterObject('A', 'TEXT', 'contains', [123])]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_TEXT
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN value for TEXT field in filters', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'A', type: 'TEXT' }],
      filters: [buildFilterObject('A', 'TEXT', 'contains', [true])]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_TEXT
    )
  })

  // ==================
  // === SHORT_TEXT ===
  // ==================
  // DONE:
  test.skip('should fail with 405 when passing NUMBER value for SHORT_TEXT field in filters', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'B', type: 'SHORT_TEXT' }],
      filters: [buildFilterObject('B', 'SHORT_TEXT', 'contains', [123])]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_SHORT_TEXT
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN value for SHORT_TEXT field in filters', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'B', type: 'SHORT_TEXT' }],
      filters: [buildFilterObject('B', 'SHORT_TEXT', 'contains', [true])]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_SHORT_TEXT
    )
  })

  // ==================
  // === NUMBER ===
  // ==================
  // DONE:
  test.skip('should fail with 405 when passing FLOAT value for NUMBER field in filters', async () => {
    // Number field just accept integers
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'C', type: 'NUMBER' }],
      filters: [buildFilterObject('C', 'NUMBER', 'equal_than', [25.5])]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_NUMBER
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing TEXT value for NUMBER field in filters', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'C', type: 'NUMBER' }],
      filters: [buildFilterObject('C', 'NUMBER', 'equal_than', ['twenty'])]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_NUMBER
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN value for NUMBER field in filters', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'C', type: 'NUMBER' }],
      filters: [buildFilterObject('C', 'NUMBER', 'equal_than', [true])]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_NUMBER
    )
  })

  // ==================
  // === FLOAT ===
  // ==================
  // DONE:
  test.skip('should fail with 405 when passing TEXT value for FLOAT field in filters', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'D', type: 'FLOAT' }],
      filters: [buildFilterObject('D', 'FLOAT', 'equal_than', ['veinticinco'])]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_FLOAT
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN value for FLOAT field in filters', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'D', type: 'FLOAT' }],
      filters: [buildFilterObject('D', 'FLOAT', 'equal_than', [true])]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_FLOAT
    )
  })

  // ==================
  // === CHOICE =======
  // ==================
  // DONE:
  test.skip('should fail with 405 when passing NUMBER values to CHOICE', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'E', type: 'CHOICE' }],
      filters: [buildFilterObject('E', 'CHOICE', 'is', [1])]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_CHOICE
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN values to CHOICE', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'E', type: 'CHOICE' }],
      filters: [buildFilterObject('E', 'CHOICE', 'is', [true])]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_CHOICE
    )
  })

  // ==================
  // === DATE =======
  // ==================
  // DONE:
  test.skip('should fail with 405 when passing TEXT value for DATE field in filters', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'F', type: 'DATE' }],
      filters: [buildFilterObject('F', 'DATE', 'after', ['invalid-date'])]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_DATE
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing BOOLEAN value for DATE field in filters', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'F', type: 'DATE' }],
      filters: [buildFilterObject('F', 'DATE', 'before', [true])]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_DATE
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing NUMBER value for DATE field in filters', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'F', type: 'DATE' }],
      filters: [buildFilterObject('F', 'DATE', 'between', [123456])]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_DATE
    )
  })

  // DONE:
  test.skip('should fail with 405 when passing a start date bigger than end date in a between DATE filter', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'F', type: 'DATE' }],
      filters: [
        buildFilterObject('F', 'DATE', 'between', ['2024-10-15', '2023-10-15']) // Start date is after end date
      ]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_DATE_RANGE
    )
  })

  // DONE:
  test.skip('should fail with 405 if date is not on format ISO8601', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'F', type: 'DATE' }],
      filters: [
        buildFilterObject('F', 'DATE', 'after', ['15/10/2024']) // Non-ISO8601 format
      ]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_DATE
    )
  })
})
