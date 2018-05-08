import {RunUtil} from '../../RunUtil'
import * as assert from 'assert'
import {KlgHttpServerPatcher} from '../../../src/patch/HttpServer'

const httpServerPatcher = new KlgHttpServerPatcher({
  recordGetParams: true,
  recordPostData: true
})

RunUtil.run(function (done) {
  httpServerPatcher.run()
  const http = require('http')
  const urllib = require('urllib')

  process.on('PANDORA_PROCESS_MESSAGE_TRACE' as any, (report: any) => {
    assert(report.name === 'HTTP-POST:/')
    assert(report.spans.length === 1)
    const logs = report.spans[0].logs
    assert(logs.length === 2)
    console.log('logs', logs)
    const getFields = logs[0].fields
    const postFields = logs[1].fields
    assert(getFields[0].key === 'query')
    assert(JSON.stringify(getFields[0].value) === '{"name":"test"}')
    assert(postFields[0].key === 'data')
    assert(JSON.stringify(postFields[0].value) === '{"age":"100"}')

    done()
  })

  const server = http.createServer((req, res) => {

    const chunks = []

    req.on('data', (chunk) => {
      chunks.push(chunk)
    })

    req.on('end', () => {
      res.end('hello')
    })
  })

  server.listen(0, () => {
    const port = server.address().port

    setTimeout(function () {
      urllib.request(`http://localhost:${port}/?name=test`, {
        method: 'post',
        data: {
          age: 100
        }
      })
    }, 1000)
  })
})
