const axios = require('axios')
const { BASE_URL, getAuthToken } = require('./jest.setup')

describe('Check API health', () => {
  let headers

  beforeAll(async () => {
    const token = await getAuthToken()
    headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Origin: 'http://localhost'
    }
  })

  test('Should return 200 code', async () => {
    console.log(BASE_URL)
    const response = await axios.get(`${BASE_URL}/health`, { headers })
    console.log(response.data)
    expect(response.status).toBe(200)
  })
})
