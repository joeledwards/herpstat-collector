#! /usr/bin/env node

const app = require('@buzuli/app')
const yargs = require('yargs')

const collector = require('../lib/collector')

const options = yargs
  .env('HERPSTAT_COLLECTOR')
  .option('herpstat-device-alias', {
    type: 'string',
    desc: 'The address of the Herpstat device from which to collect metrics',
    default: 'herpstat',
  })
  .option('herpstat-device-url', {
    type: 'string',
    desc: 'The URL of the Herpstat device from which to collect metrics',
    default: 'http://herpstat:8080',
  })
  .option('redis-server', {
    type: 'string',
    desc: 'The Redis server to which metrics should be saved',
    default: 'redis://localhost:6379',
  })
  .parse()

app(async function () {
  await collector(options)
})
