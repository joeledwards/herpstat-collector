# herpstat-collector

Collect metrics from a herpstat device's API

## Configuration

Uses yargs with an environment prefix of `HERPSTAT_COLLECTOR` such that all options
are also available as environment variables.

Options:

```
Options:
  --herpstat-device-alias  The address of the Herpstat device from which to
                           collect metrics        [string] [default: "herpstat"]
  --herpstat-device-url    The URL of the Herpstat device from which to collect
                           metrics    [string] [default: "http://herpstat:8080"]
  --redis-server           The Redis server to which metrics should be saved
                                    [string] [default: "redis://localhost:6379"]
```
