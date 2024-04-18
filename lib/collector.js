module.exports = collector

const Redis = require('ioredis')
const moment = require('moment')
const buzJson = require('@buzuli/json')
const { fetchMetrics } = require('./herpstat')

async function collector (config) {
  const {
    herpstatDeviceId,
    herpstatDeviceUrl,
    redisServer,
    checkInterval: requestedCheckInterval,
  } = config

  const checkInterval = Math.max(requestedCheckInterval, 15)
  const checkIntervalMillis = checkInterval * 1000

  console.info(`Config:\n${buzJson({ herpstatDeviceId, herpstatDeviceUrl, redisServer, checkInterval })}`)

  let lastCheckTime

  async function checkDelay () {
    let delayUntil = lastCheckTime + checkIntervalMillis
    let delayMillis = Math.max(delayUntil - lastCheckTime, 0)

    console.info(`Delaying for ${delayMillis} milliseconds`)

    return new Promise(done => {
      setTimeout(done, delayMillis)
    })
  }

  async function doCheck () {
    console.info(`Collecting metrics ...`)
    lastCheckTime = moment.utc().valueOf()

    const result = await fetchMetrics(herpstatDeviceUrl)

    console.info(buzJson(result))
  }

  while (true) {
    await doCheck()
    await checkDelay()
  }
}
