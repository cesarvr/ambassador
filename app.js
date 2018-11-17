let { HTTPService, HTTPServer } =  require('node-ambassador')
//let { HTTPService, HTTPServer } =  require('../ambassador')

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

class Stats  {

  constructor(){
    this.db = {}
  }

  new_entry(){
    let key = this.endpoint
    let entry = undefined

    // if the entry doesn't exist, instantiate a new object
    this.db[key]      =  this.db[key] || {}

    entry = this.db[key] // we retrieve the object by reference.
    entry.hit  = entry.hit || 0
    entry.avg  = entry.avg || 0
    entry.total = entry.total || 0
    entry.history = entry.history || []

    entry.hit += 1
    entry.total += this.end
    entry.history.push({time: this.end + 'ms', method:this.method, response: this.response })
    entry.avg =  Math.round((this.end / entry.hit) * 100) / 100 + 'ms' // truncating
  }

  readResponse(response){
    this.response = response 
    return this
  }

  readRequest(header){
    this.method   = header.HTTPMethod
    this.endpoint = header.HTTPResource

    return this
  }

  start_profile(){
    this.start = new Date().getTime()
    return this
  }

  end_profile() {
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

function handleConnection(server) {
  let tport = process.env['TARGET_PORT'] || 8087
  console.log(`Target port: ${tport}`)
  let service = new HTTPService({port: tport })

  server.on('server:http:headers',   
                          (header, data) => stats.readRequest(header)
                                                 .start_profile() )

  service.on('service:http:headers', (header, data) => 
                                            stats.readResponse(header,data)
                                                 .end_profile()
                                                 .new_entry() )

  service.on('service:http:404', (header, response) => server.respond(HTTP404) ) 

  // Tunnel
  server.on( 'server:read',  data => service.send(data)   )
  service.on('service:read', data => server.send(data)    )
}


let port = process.env['PORT'] || 8080
new HTTPServer({port, handler: handleConnection})
console.log(`Listening for request in ${port}!!`)
