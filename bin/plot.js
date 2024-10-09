#! /usr/bin/env node

const fs = require('fs')
const app = require('@buzuli/app')
const path = require('path')
const yargs = require('yargs')
const moment = require('moment')
const byLine = require('byline')
const asciiplot = require('asciiplot')

const options = yargs
  .option('data-dir', {
    type: 'string',
    desc: 'The path to the herpstat data directory',
    default: '.',
  })
  .option('date', {
    type: 'string',
    desc: "The date to plot (default is today's date)",
  })
  .parse()

app(async () => {
  const height = 10
  const width  = 50

  const dataDir = options.dataDir

  const date = options.date ? moment(options.date) : moment();
  const dateStr = date.format('YYYYMMDD')

  const files = await fs.promises.readdir(dataDir)
  const [file] = files.filter(file => file.includes(dateStr))

  if (file == null) {
    console.info(`No data found for date ${date.format('YYYY-MM-DD')}`)
    process.exit(1)
  }

  const filePath = path.join(dataDir, file);
  const data = {}

  console.info({
    date,
    dataDir,
    file,
    filePath,
  })

  await readLines(filePath, line => {
    try {
      const record = JSON.parse(line)

      const {
        system: {
          numberofoutputs: numOutputs
        }
      } = record

      const {
        metadata: {
          timestamp
        }
      } = record

      for (let i = 1; i <= numOutputs; i++) {
        const outputId = `output${i}`
        const {
          outputnickname: outputName,
          probereadingTEMP: temperature
        } = record[outputId]

        let outputData = data[outputId] || { outputName, temps: [] }

        outputData.temps.push({ temperature, timestamp: moment(timestamp) })

        data[outputId] = outputData
      }
    } catch (error) {
      console.error(`Error processing line:\n${line}\n`, error)
      throw error
    }
  })

  Object.keys(data).forEach(outputId => {
    const {
      outputName,
      temps
    } = data[outputId]

    const minTs = minValue(temps.map(t => t.timestamp.toISOString()))
    const maxTs = maxValue(temps.map(t => t.timestamp.toISOString()))

    const tempValues = temps.map(t => t.temperature)

    const tempSamples = downsample(tempValues, width)
    console.info(`Start ${minTs}`)
    console.info(`End   ${maxTs}`)
    const plot = asciiplot.plot(tempSamples, { height: 10 })
    console.info(`${outputId} [${outputName}]\n${plot}\n`)
  })
})

function maxValue (list) {
  return list.reduce((acc, v) => {
    if (acc == null) return v
    if (v == null) return acc
    if (acc > v) return acc
    return v
  })
}

function minValue (list) {
  return list.reduce((acc, v) => {
    if (acc == null) return v
    if (v == null) return acc
    if (acc < v) return acc
    return v
  })
}

async function readLines (file, lineHandler) {
  return new Promise((resolve, reject) => {
    try {
      const fileStream = fs.createReadStream(file)
      const lineStream = byLine.createStream(fileStream)
      lineStream.once('error', reject)
      lineStream.once('end', resolve)
      lineStream.on('data', lineHandler)
    } catch (exception) {
      reject(exception)
    }
  })
}

function downsample (values, max) {
  if (values.length > max) {
    const samples = []
    const factor = Math.floor(values.length / max)
    const remainder = values.length % max
    const skipCount = (remainder === 0) ? factor - 1 : factor
    let skipsRemaining = skipCount

    values.forEach(value => {
      if (skipsRemaining > 0) {
        skipsRemaining--
      } else {
        samples.push(value)
        skipsRemaining = skipCount
      }
    })

    return samples
  } else {
    return values
  }
}
