module.exports = collector

const fs = require('fs')
const Redis = require('ioredis')
const moment = require('moment')
const buzJson = require('@buzuli/json')
const { fetchMetrics } = require('./herpstat')

async function collector (config) {
  const {
    deviceAlias,
    deviceUrl,
    redisUri,
    dataPath,
    checkInterval: requestedCheckInterval,
  } = config

  const checkInterval = Math.max(requestedCheckInterval, 15)
  const checkIntervalMillis = checkInterval * 1000

  console.info(`Config:\n${buzJson({ deviceAlias, deviceUrl, redisUri, checkInterval })}`)

  let lastCheckTime

  let redis
  if (redisUri) {
    redis = new Redis(redisUri)
    redis.on('reconnecting', () => console.info('Reconnecting to Redis ...'))
    redis.on('ready', () => console.info('Redis connection is ready'))
  }

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
    const timestamp = moment.utc().valueOf()
    lastCheckTime = timestamp

    const result = await fetchMetrics(deviceUrl)

    if (result.status === "success") {
      await saveMetricsToRedis({ record, timestamp })
      await writeRecordToDisk({ record, timestamp })
    }
  }

  async function saveMetricsToRedis ({ record, timestamp }) {
    if (redis != null) {
      const {
        system: {
          nickname,
          numberofoutputs: numOutputs,
        }
      } = record

      const deviceName = deviceAlias || nickname

      for (let i = 1; i <= numOutputs; i++) {
        const outputId = `output${i}`
        const outputData = record[outputId]

        if (outputData != null) {
          const {
            outputnickname: outputName,
            probereadingTEMP: temperature,
          } = outputData

          const key = `herpstat/device=${deviceName}/output=${i}_${outputName}/temperature`
          const value = JSON.stringify({
            ts: timestamp,
            temp: temperature,
          })

          await redis.rpush(key, value)
        }
      }
    }
  }

  async function saveRecordToDisk ({ record, timestamp }) {
    if (dataPath != null) {
      const {
        system: {
          nickname
        }
      } = record

      const deviceName = deviceAlias || nickname
      const fileDir = `${dataPath}/${deviceName}`
      const fileName = `${deviceName}_${timestamp.format('YYYYMMDD')}.json`
      const filePath = `${fileDir}/${fileName}`

      await fs.promises.mkdir(fileDir, { recursive: true })

      const line = JSON.stringify(record) + "\n"

      await fs.promises.appendFile(filePath, line, 'utf8')
    }
  }

  while (true) {
    await doCheck()
    await checkDelay()
  }
}

