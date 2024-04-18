module.exports = collector

const buzJson = require('@buzuli/json')
const Redis = require('ioredis')
const { fetchMetrics } = require('./herpstat')

async function collector (config) {
  const {
    herpstatDeviceAlias,
    herpstatDeviceUrl,
    redisServer,
  } = config

  console.info(`Config:\n${buzJson(config)}`)
   
  const result = await fetchMetrics(herpstatDeviceUrl)

  console.info()
  console.info(`Base URL: ${herpstatDeviceUrl} => [${result.status}]`)
  //console.info(buzJson(result))
}
