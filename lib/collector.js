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
    dataDir,
    checkInterval: requestedCheckInterval,
    verbose,
  } = config

  const checkInterval = Math.max(requestedCheckInterval, 15)
  const checkIntervalMillis = checkInterval * 1000

  if (verbose) {
    console.info(`Config:\n${buzJson({ deviceAlias, deviceUrl, redisUri, checkInterval })}`)
  }

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

    if (verbose) {
      console.info(`Delaying for ${delayMillis} milliseconds`)
    }

    return new Promise(done => {
      setTimeout(done, delayMillis)
    })
  }

  async function doCheck () {
    if (verbose) {
      console.info(`Collecting metrics ...`)
    }

    const timestamp = moment.utc()
    lastCheckTime = timestamp.valueOf()

    const {
      status,
      data: record
    } = await fetchMetrics(deviceUrl)

    if (status === "success") {
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
          try {
            const {
              outputnickname: outputName,
              probereadingTEMP: temperature,
            } = outputData

            const key = `herpstat/device=${deviceName}/output=${i}_${outputName}/temperature`
            const value = JSON.stringify({
              ts: timestamp,
              temp: temperature,
            })

            if (verbose) {
              console.info(`Appending metrics to redis key ${key}`)
            }

            await redis.rpush(key, value)
          } catch (error) {
            console.error('Failed to write metrics to Redis', error)
          }
        }
      }
    }
  }

  async function writeRecordToDisk ({ record, timestamp }) {
    if (dataDir != null) {
      try {
        const {
          system: {
            nickname
          }
        } = record

        const deviceName = deviceAlias || nickname
        const fileDir = `${dataDir}/${deviceName}`
        const fileName = `${deviceName}_${timestamp.format('YYYYMMDD')}.json`
        const filePath = `${fileDir}/${fileName}`

        if (verbose) {
          console.info(`Writing record to ${filePath}`)
        }

        await fs.promises.mkdir(fileDir, { recursive: true })

        const recordWithMetadata = {
          ...record,
          metadata: {
            timestamp
          }
        }
        const line = JSON.stringify(recordWithMetadata) + "\n"

        await fs.promises.appendFile(filePath, line, 'utf8')
      } catch (error) {
        console.error('Failed to write record to disk', error)
      }
    }
  }

  while (true) {
    await doCheck()
    await checkDelay()
  }
}

