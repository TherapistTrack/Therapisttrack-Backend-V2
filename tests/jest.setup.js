require('dotenv').config()
const axios = require('axios')

const BASE_URL = `http://127.0.0.1:${process.env.API_PORT}`

let accessToken = null

async function getAuthToken() {
  if (accessToken) {
    return accessToken
  }

  if (process.env.RUNNING_MODE === 'TEST') {
    accessToken = 'dummy-token'
    return accessToken
  }

  try {
    const response = await axios.post(
      `${process.env.AUTH_ISSUER_BASE_URL}oauth/token`,
      {
        client_id: process.env.AUTH_CLIENT_ID,
        client_secret: process.env.AUTH_CLIENT_SECRET,
        audience: process.env.AUTH_AUDIENCE,
        grant_type: 'client_credentials'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    console.log(response.data)
    accessToken = response.data.access_token
    return accessToken
  } catch (error) {
    console.error('Error obtaining token:', error.message)
    throw error
  }
}

module.exports = {
  BASE_URL,
  getAuthToken
}
