module.exports = {
  fetchMetrics,
}

const axios = require('axios')

async function fetchMetrics (deviceUrl) {
  const url = `${deviceUrl}/RAWMETRICS`

  const {
    status,
    data,
  } = await axios({
    method: 'GET',
    url,
    validateStatus: () => true,
  })

  console.info(`GET ${url} => ${status}`)

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
