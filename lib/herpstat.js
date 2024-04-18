module.exports = {
  fetchMetrics,
}

const axios = require('axios')
const moment = require('moment')

async function fetchMetrics (deviceUrl) {
  const url = `${deviceUrl}/RAWSTATUS`

  const start = moment.utc()
  const startTs = start.toISOString()

  const {
    status,
    data,
  } = await axios({
    method: 'GET',
    url,
    validateStatus: () => true,
  })

  const end = moment.utc()
  const endTs = end.toISOString()

  if (status < 400) {
    return {
      status: 'success',
      data,
      startTs,
      endTs,
    }
  } else {
    return {
      status: 'failure',
      statusCode: status,
      data,
      startTs,
      endTs,
    }
  }
}
