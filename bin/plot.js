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

      for (let i = 1; i <= numOutputs; i++) {
        const outputId = `output${i}`
        const {
          outputnickname: outputName,
          probereadingTEMP: temp
        } = record[outputId]

        let outputData = data[outputId] || { outputName, temps: [] }

        outputData.temps.push(temp)

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

    const tempSamples = downsample(temps, width)
    //console.info(`Plotting ${tempSamples.length} of ${temps.length} temperatures`)
    const plot = asciiplot.plot(tempSamples, { height: 10 })
    console.info(`${outputId} [${outputName}]\n${plot}\n`)
  })
})

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
