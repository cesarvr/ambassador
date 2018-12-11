
const HTTP404 = `
HTTP/1.0 404 File not found
Server: Sitio 💥
Date: ${Date()}
Content-Type: text/html
Connection: close

<body>
  <H1>Endpoint Not Found</H1>
  <img src="https://www.wykop.pl/cdn/c3201142/comment_E6icBQJrg2RCWMVsTm4mA3XdC9yQKIjM.gif">
</body>`


class Stats {

  constructor(){
    this.db = {}
    this.os = require('os')
  }

  isFile(endpoint) {
    const file_regexp = /\.[0-9a-z]+$/i
    return endpoint.search(file_regexp) !== -1
  }

<<<<<<< HEAD
  host() {
    return this.os.hostname()
  }

  resources(){
    return {
      free_memory: this.os.freemem(),
      total_memory: this.os.totalmem(),
      cpus: this.os.cpus()
    }
  }

  history(obj) {
    let history = obj.history || []

    history.push({
      request: {endpoint: this.endpoint, method: this.method},
      response: this.response,
      time: this.end + 'ms',
      started: this.start,
      resource: this.resources()
    })

    return history
  }

  new(){
=======
  save(){
>>>>>>> 01ebd7a9e54fe549dea1c51fb8d80e567453e35c
    let URL = this.endpoint
    this.db[URL] = this.db[URL] || {}

    this.db[URL] = {
      history: this.history(this.db[URL]),
      file: this.isFile(URL),
      pod: this.host()
    }

  }

  readResponse(response) {
    this.response = response
    return this
  }

  readRequest(header) {
    this.method   = header.HTTPMethod
    this.endpoint = header.HTTPResource

    return this
  }

  startProfile() {
    this.start = new Date().getTime()
    return this
  }

  endProfile() {
    this.end =  new Date().getTime() - this.start
    return this
  }

  get all() {
    return this.db
  }
}

let stats = new Stats()

setInterval(()=> {
  console.log('logs -> \n ', JSON.stringify(stats.all))
}, 5000)


let { Ambassador }  = require('node-ambassador')
//let { Ambassador }  = require('../node-ambassador/')

const TARGET = process.env['TARGET_PORT'] || 8087
const PORT   = process.env['PORT'] || 8080


function telemetry({service, server}) {
  server.on('http:data',  (header) => stats.readRequest(header)
    .startProfile())

<<<<<<< HEAD
  service.on('http:data', (header, data) =>
    stats.readResponse(header,data)
    .endProfile()
    .new() )
=======
    service.on('http:data', (header, data) =>
                                    stats.readResponse(header,data)
                                         .endProfile()
                                         .save() )
>>>>>>> 01ebd7a9e54fe549dea1c51fb8d80e567453e35c
}

function override_404({service, server}) {
  service.on('http:404', () => console.log('404 Detected!'))
  service.on('http:404', () => server.respond(HTTP404))
}

new Ambassador({port: PORT, target: TARGET})
  .tunnel({override_404, telemetry })

console.log(`listening for request in ${PORT} and targeting ${TARGET}`)
