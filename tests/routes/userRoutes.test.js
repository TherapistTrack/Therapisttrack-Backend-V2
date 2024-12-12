const axios = require('axios')
const { BASE_URL, getAuthToken } = require('../jest.setup')
const COMMON_MSG = require('../errorMsg')
const { checkFailRequest, generateObjectId } = require('../testHelpers')

describe('User Endpoints', () => {
  const HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    Origin: 'http://localhost'
  }

  const doctorUser = {
    id: generateObjectId(),
    names: 'Test',
    lastNames: 'User',
    phones: ['12345678'],
    rol: 'Doctor',
    mails: ['test-doctor@example.com'],
    roleDependentInfo: {
      collegiateNumber: '12345',
      specialty: 'testSpecialty'
    }
  }

  const assistantUser = {
    id: generateObjectId(),
    names: 'Test',
    lastNames: 'User',
    phones: ['12345678'],
    rol: 'Assistant',
    mails: ['test-assistant@example.com'],
    roleDependentInfo: {
      startDate: '2024-12-09T15:30:00Z',
      endDate: '2024-12-10T15:30:00Z',
      DPI: '1234123412341'
    }
  }

  const adminUser = {
    id: generateObjectId(),
    names: 'Test',
    lastNames: 'User',
    phones: ['12345678'],
    rol: 'Admin',
    mails: ['test-admin@example.com']
  }

  test('should register a new Doctor', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/users`, doctorUser, {
        headers: HEADERS
      })
      expect(response.status).toBe(200)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    } catch (error) {
      console.log(
        `Status: ${error.response.status} \nBody: ${JSON.stringify(error.response.data)}`
      )
      throw new Error('Test failed')
    }
  })

  test('should register a new Assistant', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/users`, assistantUser, {
        headers: HEADERS
      })
      expect(response.status).toBe(200)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    } catch (error) {
      throw new Error(
        `Test Failed: \nStatus: ${error.response.status} \nBody: ${JSON.stringify(error.response.data)}`
      )
    }
  })

  test('should register a new Admin', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/users`, adminUser, {
        headers: HEADERS
      })
      expect(response.status).toBe(200)
      expect(response.data.message).toBe(COMMON_MSG.REQUEST_SUCCESS)
    } catch (error) {
      throw new Error(
        `Test Failed: \nStatus: ${error.response.status} \nBody: ${JSON.stringify(error.response.data)}`
      )
    }
  })

  test('should update the user information', async () => {
    try {
      const updateData = { ...assistantUser }
      updateData.names = 'NEW NAME'
      await axios.put(`${BASE_URL}/users/update`, updateData, {
        headers: HEADERS
      })
      const newUser = await axios.get(`${BASE_URL}/users/${assistantUser.id}`, {
        headers: HEADERS
      })

      expect(newUser.data.data.names).toBe('NEW NAME')
    } catch (error) {
      throw new Error(
        `Test Failed:\n Status: ${error.response.status} \nBody: ${JSON.stringify(error.response.data)} \n}}`
      )
    }
  })

  test('should not register an existent user', async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/users/register`,
        doctorUser,
        { headers: HEADERS }
      )
      expect(true).toBe(false) // Request should fail, but it didnt
    } catch (error) {
      console.log(
        `Status: ${error.response.status} \nBody: ${JSON.stringify(error.response.data)}`
      )
      expect(error.response.status).toBe(400)
    }
  })

  test('should retrieve a User info by ID', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/users/${doctorUser.id}`, {
        headers: HEADERS
      })
      expect(response.status).toBe(200)
    } catch (error) {
      console.log()
      throw new Error(
        `Test Failed: \nStatus: ${error.response.status} \nBody: ${JSON.stringify(error.response.data)}`
      )
    }
  })

  test('should retrieve info from the User requesting', async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/users/@me`,
        { id: doctorUser.id },
        { headers: HEADERS }
      )
      expect(response.status).toBe(200)
    } catch (error) {
      console.log(
        `Status: ${error.response?.status} \nBody: ${JSON.stringify(error.response?.data)}`
      )
      throw new Error('Test failed')
    }
  })

  test('should give a list of files with the two already registered users', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/users/list`, {
        headers: HEADERS
      })
      expect(response.status).toBe(200)
      expect(response.data.users.length).toBeGreaterThanOrEqual(3)
    } catch (error) {
      throw new Error(
        `Test Failed:\n Status: ${error.response.status} \nBody: ${JSON.stringify(error.response.data)}`
      )
    }
  })

  test('should delete Doctor', async () => {
    try {
      const response = await axios.delete(`${BASE_URL}/users`, {
        data: { id: doctorUser.id },
        headers: HEADERS
      })
      expect(response.status).toBe(200)
    } catch (error) {
      throw new Error(
        `Test Failed:\n Status: ${error.response.status} \nBody: ${JSON.stringify(error.response.data)}`
      )
    }
  })
  test('should delete Assistant', async () => {
    try {
      const response = await axios.delete(`${BASE_URL}/users`, {
        data: { id: assistantUser.id },
        headers: HEADERS
      })
      expect(response.status).toBe(200)
    } catch (error) {
      throw new Error(
        `Test Failed:\n Status: ${error.response.status} \nBody: ${JSON.stringify(error.response.data)}`
      )
    }
  })

  /*
  test('should fail to update non-existent user', async () => {
    const updateData = { username: 'nonexistentuser', name: 'UpdatedName' }
    const response = await axios
      .put(`${BASE_URL}/users/update`, updateData, { headers })
      .catch((err) => err.response)
    expect(response.status).toBe(400)
    expect(response.data.status).toBe('error')
    expect(response.data.message).toBe('User not found or no updates made')
  })

  */
})
