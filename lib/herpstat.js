module.exports = {
  fetchMetrics,
}

const axios = require('axios')

async function fetchMetrics (deviceUrl) {
  const url = `${deviceUrl}/`

  const {
    status,
    data,
  } = await axios({
    method: 'GET',
    url,
    validateStatus: () => true,
  })

  if (status < 400) {
    return {
      status: 'success',
      data,
    }
  } else {
    return {
      status: 'failure',
      statusCode: status,
      data,
    }
  }
}
