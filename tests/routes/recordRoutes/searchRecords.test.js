const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../../jest.setup')
const {
  createTestDoctor,
  createTestPatientTemplate,
  createTestRecord,
  deleteUser,
  checkFailRequest,
  buildSearchRequestBody,
  buildFilterObject,
  buildSortObject,
  iso8601Regex,
  validateResponse,
  deleteObjectAttribute,
  modifyObjectAttribute
} = require('../../testHelpers')
const COMMON_MSG = require('../../errorMsg')
const yup = require('yup')

describe('Search Records endpoint', () => {
  let doctorId, userId, templateId
  const REQUEST_URL = `${BASE_URL}/records/search`

  const HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  const BASE_REQUEST = {
    doctorId: '',
    limit: 10,
    page: 0,
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

  beforeAll(async () => {
    const doctor = await createTestDoctor()
    userId = doctor.id
    doctorId = doctor.roleDependentInfo.id
    BASE_REQUEST.doctorId = doctorId

    templateId = await createTestPatientTemplate(
      doctorId,
      `Plantilla de Búsqueda_${Date.now()}`,
      ['General'],
      [
        {
          name: 'Notas cortas',
          type: 'SHORT_TEXT',
          required: true,
          description: 'Fecha de nacimiento del paciente'
        },
        {
          name: 'Notas',
          type: 'TEXT',
          required: true,
          description: 'Notas extra'
        },
        {
          name: 'Edad',
          type: 'NUMBER',
          required: true,
          description: 'Edad del paciente'
        },
        {
          name: 'Altura',
          type: 'FLOAT',
          required: true,
          description: 'Edad del paciente'
        },
        {
          name: 'Fecha de nacimiento',
          type: 'DATE',
          required: true,
          description: 'Fecha de nacimiento del paciente'
        },
        {
          name: 'Estado civil',
          type: 'CHOICE',
          options: ['Soltero', 'Casado'],
          description: 'Estado de la persona',
          required: true
        }
      ]
    )

    // Crear varios registros asociados a la plantilla para realizar las pruebas
    await createTestRecord(doctorId, templateId, {
      names: 'Juan',
      lastnames: 'Pérez García',
      fields: [
        { name: 'Notas cortas', value: 'a' },
        { name: 'Notas', value: 'a' },
        { name: 'Altura', value: 1.2 },
        { name: 'Edad', value: 100 },
        { name: 'Fecha de nacimiento', value: '1993-07-15T00:00:00Z' },
        { name: 'Estado civil', value: 'Soltero' }
      ]
    })

    await createTestRecord(doctorId, templateId, {
      names: 'Ana',
      lastnames: 'López Martínez',
      fields: [
        { name: 'Notas cortas', value: 'b' },
        { name: 'Notas', value: 'b' },
        { name: 'Altura', value: 1.3 },
        { name: 'Edad', value: 25 },
        { name: 'Fecha de nacimiento', value: '1998-03-22T00:00:00Z' },
        { name: 'Estado civil', value: 'Casado' }
      ]
    })

    await createTestRecord(doctorId, templateId, {
      names: 'Carlos',
      lastnames: 'Ramírez Díaz',
      fields: [
        { name: 'Notas cortas', value: 'c' },
        { name: 'Notas', value: 'c' },
        { name: 'Altura', value: 1.4 },
        { name: 'Edad', value: 40 },
        { name: 'Fecha de nacimiento', value: '1982-11-01T00:00:00Z' },
        { name: 'Estado civil', value: 'Soltero' }
      ]
    })
  })

  afterAll(async () => {
    await deleteUser(userId)
  })

  const SEARCH_RESPONSE_SCHEMA = yup
    .object()
    .shape({
      status: yup.number().required().oneOf([200]),
      message: yup.string().required().oneOf([COMMON_MSG.REQUEST_SUCCESS]),
      total: yup.number().required(),
      records: yup
        .array()
        .of(
          yup.object().shape({
            recordId: yup.string().required(),
            templateId: yup.string().required(),
            createdAt: yup.string().matches(iso8601Regex).required(),
            patient: yup.object().shape({
              names: yup.string().required(),
              lastNames: yup.string().required(),
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
          })
        )
        .required()
    })
    .noUnknown(true)

  // DONE:
  test('should suceed with 200 searching a list of patients with no sorting or filtering', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [
        { name: 'Edad', type: 'NUMBER' },
        { name: 'Fecha de nacimiento', type: 'DATE' },
        { name: 'Estado civil', type: 'CHOICE' }
      ]
    })

    try {
      const response = await axios.post(REQUEST_URL, searchRequestBody, {
        headers: HEADERS
      })

      expect(response.status).toBe(200)
      validateResponse(response.data, SEARCH_RESPONSE_SCHEMA)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
      expect(response.data.records.length).toBeGreaterThan(0)
      expect(response.data.total).toBe(response.data.records.length)
      response.data.records.forEach((record) => {
        expect(record).toEqual(
          expect.objectContaining({
            patient: expect.objectContaining({
              fields: expect.arrayContaining([
                expect.objectContaining({
                  name: 'Edad',
                  type: 'NUMBER',
                  value: expect.any(Number)
                }),
                expect.objectContaining({
                  name: 'Fecha de nacimiento',
                  type: 'DATE',
                  value: expect.any(String)
                }),
                expect.objectContaining({
                  name: 'Estado civil',
                  type: 'CHOICE',
                  value: expect.any(String)
                })
              ])
            })
          })
        )
      })
    } catch (error) {
      console.error(
        'Error searching for list of patients:',
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
  test('should suceed with 200 searching a list of patients with sorting on SHORT_TEXT field', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: {},
      sorts: [buildSortObject('nombres', 'SHORT_TEXT', 'asc')]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    expect(response.data.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          patient: expect.objectContaining({
            names: expect.any(String),
            lastnames: expect.any(String)
          })
        })
      ])
    )
  })

  // TODO:
  test('should suceed with 200 searching a list of patients with sorting on TEXT field', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      sorts: [buildSortObject('comentarios', 'TEXT', 'desc')]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    validateResponse(response.data, SEARCH_RESPONSE_SCHEMA)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records.length).toBeGreaterThan(0)
  })

  // TODO:
  test('should suceed with 200 searching a list of patients with sorting on NUMBER field', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      sorts: [buildSortObject('edad', 'NUMBER', 'asc')]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    validateResponse(response.data, SEARCH_RESPONSE_SCHEMA)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records.length).toBeGreaterThan(0)
  })

  // TODO:
  test('should suceed with 200 searching a list of patients with sorting on FLOAT field', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      sorts: [buildSortObject('peso', 'FLOAT', 'desc')]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    validateResponse(response.data, SEARCH_RESPONSE_SCHEMA)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records.length).toBeGreaterThan(0)
  })

  // TODO:
  test('should suceed with 200 searching a list of patients with sorting on DATE field', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      sorts: [buildSortObject('Fecha de nacimiento', 'DATE', 'asc')]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
  })

  // TODO:
  test('should suceed with 200 searching a list of patients with sorting on CHOICE field', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      sorts: [buildSortObject('Estado civil', 'CHOICE', 'asc')]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
  })

  // ===================
  // ==== FILTERING
  // ===================
  // TODO:
  test("should suceed with 200 filtering by TEXT field with 'contains'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      filters: [
        buildFilterObject('comentarios', 'TEXT', 'contains', ['importante'])
      ]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) =>
            field.name === 'comentarios' && field.value.includes('importante')
        )
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by TEXT field with 'starts_with'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      filters: [
        buildFilterObject('comentarios', 'TEXT', 'starts_with', ['Nota'])
      ]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) =>
            field.name === 'comentarios' && field.value.startsWith('Nota')
        )
      ).toBe(true)
    })
  })

  // DONE:
  test("should suceed with 200 filtering by TEXT field with 'ends_with'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      filters: [
        buildFilterObject('comentarios', 'TEXT', 'ends_with', ['final'])
      ]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) =>
            field.name === 'comentarios' && field.value.endsWith('final')
        )
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by SHORT_TEXT field with 'contains'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      filters: [
        buildFilterObject('nombre_medio', 'SHORT_TEXT', 'contains', ['med'])
      ]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) =>
            field.name === 'nombre_medio' && field.value.includes('med')
        )
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by SHORT_TEXT field with 'starts_with'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      filters: [
        buildFilterObject('nombre_medio', 'SHORT_TEXT', 'starts_with', ['Ini'])
      ]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) =>
            field.name === 'nombre_medio' && field.value.startsWith('Ini')
        )
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by SHORT_TEXT field with 'ends_with'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      filters: [
        buildFilterObject('nombre_medio', 'SHORT_TEXT', 'ends_with', ['nal'])
      ]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) =>
            field.name === 'nombre_medio' && field.value.endsWith('nal')
        )
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by NUMBER field with 'less_than'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId,
      filters: [buildFilterObject('Age', 'NUMBER', 'less_than', [30])]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) => field.name === 'Age' && field.value < 30
        )
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by NUMBER field with 'greater_than'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId,
      filters: [buildFilterObject('Age', 'NUMBER', 'greater_than', [20])]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) => field.name === 'Age' && field.value > 20
        )
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by NUMBER field with 'equal_than'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId,
      filters: [buildFilterObject('Age', 'NUMBER', 'equal_than', [25])]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) => field.name === 'Age' && field.value === 25
        )
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by FLOAT field with 'less_than'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId,
      filters: [buildFilterObject('peso', 'FLOAT', 'less_than', [75.5])]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) => field.name === 'peso' && field.value < 75.5
        )
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by FLOAT field with 'greater_than'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId,
      filters: [buildFilterObject('peso', 'FLOAT', 'greater_than', [50.0])]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) => field.name === 'peso' && field.value > 50.0
        )
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by FLOAT field with 'equal_than'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId,
      filters: [buildFilterObject('peso', 'FLOAT', 'equal_than', [65.5])]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) => field.name === 'peso' && field.value === 65.5
        )
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by DATE field with 'after'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId,
      filters: [
        buildFilterObject('Fecha de nacimiento', 'DATE', 'after', [
          '2024-01-01T00:00:00Z'
        ])
      ]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) =>
            field.name === 'Fecha de nacimiento' &&
            new Date(field.value) > new Date('2024-01-01T00:00:00Z')
        )
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by DATE field with 'before'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId,
      filters: [
        buildFilterObject('Fecha de nacimiento', 'DATE', 'before', [
          '2024-12-31T23:59:59Z'
        ])
      ]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) =>
            field.name === 'Fecha de nacimiento' &&
            new Date(field.value) < new Date('2024-12-31T23:59:59Z')
        )
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by DATE field with 'between'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId,
      filters: [
        buildFilterObject('Fecha de nacimiento', 'DATE', 'between', [
          '2024-01-01T00:00:00Z',
          '2024-12-31T23:59:59Z'
        ])
      ]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some((field) => {
          const dateValue = new Date(field.value)
          return (
            field.name === 'Fecha de nacimiento' &&
            dateValue >= new Date('2024-01-01T00:00:00Z') &&
            dateValue <= new Date('2024-12-31T23:59:59Z')
          )
        })
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by CHOICE field with 'is'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId,
      filters: [buildFilterObject('Estado civil', 'CHOICE', 'is', ['Casado'])]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) => field.name === 'Estado civil' && field.value === 'Casado'
        )
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by CHOICE field with 'is_not'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId,
      filters: [
        buildFilterObject('Estado civil', 'CHOICE', 'is_not', ['Soltero'])
      ]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) => field.name === 'Estado civil' && field.value !== 'Soltero'
        )
      ).toBe(true)
    })
  })

  // TODO:
  test("should suceed with 200 filtering by CHOICE field with 'is_not_empty'", async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId,
      filters: [buildFilterObject('Estado civil', 'CHOICE', 'is_not_empty', [])]
    })

    const response = await axios.post(REQUEST_URL, searchRequestBody, {
      headers: HEADERS
    })

    expect(response.status).toBe(200)
    expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    expect(response.data.records).toBeInstanceOf(Array)
    expect(response.data.records.length).toBeGreaterThan(0)
    response.data.records.forEach((record) => {
      expect(
        record.patient.fields.some(
          (field) =>
            field.name === 'Estado civil' &&
            field.value &&
            field.value.trim() !== ''
        )
      ).toBe(true)
    })
  }) 
    */

  // ====================
  // == ERRORS
  // ===================

  // DONE:
  test('should fail with 400 if doctorId is not sent', async () => {
    const body = deleteObjectAttribute(BASE_REQUEST, 'doctorId')
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // DONE:
  test("should fail with 400 if 'limit' is not sent", async () => {
    const body = deleteObjectAttribute(BASE_REQUEST, 'limit')
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // DONE:
  test("should fail with 400 if 'page' is not sent", async () => {
    const body = deleteObjectAttribute(BASE_REQUEST, 'page')

    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // DONE:
  test("should fail with 400 if 'fields' array is not sent", async () => {
    const body = deleteObjectAttribute(BASE_REQUEST, 'fields')

    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // DONE:
  test("should fail with 400 if 'sorts' array is not sent", async () => {
    const body = deleteObjectAttribute(BASE_REQUEST, 'sorts')
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // DONE:
  test("should fail with 400 if 'filters' array is not sent", async () => {
    const body = deleteObjectAttribute(BASE_REQUEST, 'filters')
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // DONE:
  test("should fail with 400 if 'fields' items have missing fields", async () => {
    const body = deleteObjectAttribute(BASE_REQUEST, 'fields')
    await checkFailSearchRequest(body, 400, COMMON_MSG.MISSING_FIELDS)
  })

  // ==================
  // === TEXT ===
  // ==================
  // DONE:
  test.skip('should fail with 405 when passing NUMBER value for TEXT field in filters', async () => {
    const searchRequestBody = buildSearchRequestBody({
      doctorId: doctorId,
      fields: [{ name: 'comentarios', type: 'TEXT' }],
      filters: [buildFilterObject('comentarios', 'TEXT', 'contains', [123])]
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
      fields: [{ name: 'comentarios', type: 'TEXT' }],
      filters: [buildFilterObject('comentarios', 'TEXT', 'contains', [true])]
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
      fields: [{ name: 'nombre_medio', type: 'SHORT_TEXT' }],
      filters: [
        buildFilterObject('nombre_medio', 'SHORT_TEXT', 'contains', [123])
      ]
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
      fields: [{ name: 'nombre_medio', type: 'SHORT_TEXT' }],
      filters: [
        buildFilterObject('nombre_medio', 'SHORT_TEXT', 'contains', [true])
      ]
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
      fields: [{ name: 'Edad', type: 'NUMBER' }],
      filters: [buildFilterObject('Edad', 'NUMBER', 'equal_than', [25.5])]
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
      fields: [{ name: 'Edad', type: 'NUMBER' }],
      filters: [buildFilterObject('Edad', 'NUMBER', 'equal_than', ['twenty'])]
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
      fields: [{ name: 'Edad', type: 'NUMBER' }],
      filters: [buildFilterObject('Edad', 'NUMBER', 'equal_than', [true])]
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
      fields: [{ name: 'Peso', type: 'FLOAT' }],
      filters: [
        buildFilterObject('Peso', 'FLOAT', 'equal_than', ['veinticinco'])
      ]
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
      fields: [{ name: 'Peso', type: 'FLOAT' }],
      filters: [buildFilterObject('Peso', 'FLOAT', 'equal_than', [true])]
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
      fields: [{ name: 'Estado Civil', type: 'CHOICE' }],
      filters: [buildFilterObject('Estado Civil', 'CHOICE', 'is', [1])]
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
      fields: [{ name: 'Estado Civil', type: 'CHOICE' }],
      filters: [buildFilterObject('Estado Civil', 'CHOICE', 'is', [true])]
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
      fields: [{ name: 'Fecha de nacimiento', type: 'DATE' }],
      filters: [
        buildFilterObject('Fecha de nacimiento', 'DATE', 'after', [
          'invalid-date'
        ])
      ]
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
      fields: [{ name: 'Fecha de nacimiento', type: 'DATE' }],
      filters: [
        buildFilterObject('Fecha de nacimiento', 'DATE', 'before', [true])
      ]
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
      fields: [{ name: 'Fecha de nacimiento', type: 'DATE' }],
      filters: [
        buildFilterObject('Fecha de nacimiento', 'DATE', 'between', [123456])
      ]
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
      fields: [{ name: 'Fecha de nacimiento', type: 'DATE' }],
      filters: [
        buildFilterObject('Fecha de nacimiento', 'DATE', 'between', [
          '2024-10-15',
          '2023-10-15'
        ]) // Start date is after end date
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
      fields: [{ name: 'Fecha de nacimiento', type: 'DATE' }],
      filters: [
        buildFilterObject('Fecha de nacimiento', 'DATE', 'after', [
          '15/10/2024'
        ]) // Non-ISO8601 format
      ]
    })

    await checkFailSearchRequest(
      searchRequestBody,
      405,
      COMMON_MSG.INVALID_FIELD_TYPE_DATE
    )
  })
})
