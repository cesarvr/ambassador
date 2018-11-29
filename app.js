
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
  }

  isFile(endpoint) {
    const file_regexp = /([a-zA-Z0-9\s_\\.\-\(\):])+(.jpg|.doc|.pdf|.zip|.docx|.pdf|.gif|.png|.ico)$/
    return endpoint.search(file_regexp) !== -1
  }

  new(){
    let URL = this.endpoint
    this.db[URL] = this.db[URL] || {}

    this.db[URL] = {
                    started: this.start,
                    time: this.end + 'ms',
                    response: this.response,
                    file: this.isFile(URL)
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

    service.on('http:data', (header, data) =>
                                    stats.readResponse(header,data)
                                         .endProfile()
                                         .new() )
}

function override_404({service, server}) {
  service.on('http:404', () => console.log('404 Detected!'))
  service.on('http:404', () => server.respond(HTTP404))
}

new Ambassador({port: PORT, target: TARGET})
      .tunnel({override_404, telemetry })

console.log(`listening for request in ${PORT} and targeting ${TARGET}`)

/*
new Ambassador({port: 8080, target: 8087})
          .tunnel({subscriber: ({response, request})=>{

   response.listen((header) => {
     if(header.status === '404')
      response.override(HTTP404)
   })

  request.listen((header) => stats.readRequest(header)
                                                 .startProfile())

  response.listen((header, data) => stats.readResponse(header,data)
                                         .endProfile()
                                         .new() )

}})
*/
