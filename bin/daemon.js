#! /usr/bin/env node

const app = require('@buzuli/app')
const yargs = require('yargs')

const collector = require('../lib/collector')

const options = yargs
  .env('HERPSTAT_COLLECTOR')
  .option('herpstat-device-id', {
    type: 'string',
    desc: 'The id to use when saving metrics for this device',
    default: 'herpstat',
    alias: ['i', 'id'],
  })
  .option('herpstat-device-url', {
    type: 'string',
    desc: 'The URL of the Herpstat device from which to collect metrics',
    default: 'http://herpstat:8080',
    alias: ['u', 'url'],
  })
  .option('redis-server', {
    type: 'string',
    desc: 'The Redis server to which metrics should be saved',
    default: 'redis://localhost:6379',
    alias: ['r', 'redis'],
  })
  .parse()

app(async function () {
  await collector(options)
})
