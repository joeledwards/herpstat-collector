#! /usr/bin/env node

const app = require('@buzuli/app')
const yargs = require('yargs')

const collector = require('../lib/collector')

const options = yargs
  .env('HERPSTAT_COLLECTOR')
  .option('device-alias', {
    type: 'string',
    desc: 'The alias to use when saving metrics for this device',
    default: 'herpstat',
    alias: ['alias'],
  })
  .option('device-url', {
    type: 'string',
    desc: 'The URL of the Herpstat device from which to collect metrics',
    default: 'http://herpstat:8080',
    alias: ['url'],
  })
  .option('redis-uri', {
    type: 'string',
    desc: 'The Redis server to which metrics should be saved',
    default: 'redis://localhost:6379',
    alias: ['redis'],
  })
  .option('data-path', {
    type: 'string',
    desc: 'The directory where full records should be written',
  })
  .option('check-interval', {
    type: 'number',
    desc: 'Seconds between performing checks (minimum is 15)',
    default: 60,
    alias: ['interval'],
  })
  .parse()

app(async () => {
  await collector(options)
})
