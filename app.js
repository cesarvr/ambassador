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
    entry.history.push({time: this.end + 'ms', method:this.method })
    entry.avg =  Math.round((this.end / entry.hit) * 100) / 100 + 'ms' // truncating
  }

  readResponse(response){
    this.response = response 
  }

  readRequest(header){
    
    //this.method   = RequestComponents.HTTPMethod
    //this.endpoint = RequestComponents.HTTPResource
  }

  start_profile(){
    this.start = new Date().getTime()
  }

  end_profile() {
    this.end =  new Date().getTime() - this.start
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

/*
 service.on('service:response:200', response => server.respond(response) )
  server.on('server:traffic', data => stats.start_profile())
  service.on('service:response:all', (status, data) => stats.new_entry())
  service.on('service:response:all', (status, data) => stats.end_profile())
  service.on('service:response:all', (status, data) => console.log('service has responded !!'))

  server.on('server:traffic', data => service.send(data))
  service.on('service:response:200', response => server.respond(response) )
  service.on('service:response:404', response => server.respond([HTTP404]) )
  
  service.on('service:response:404', response => server.respond([HTTP404]) ) */

  server.on('service:http:all', (header, data) => stats.readResponse(header,data))
  service.on('service:http:404', (header, response) => server.respond(HTTP404) ) 

  server.on('http:traffic', data => stats.readRequest()  )
  server.on('http:traffic', data => service.send(data)   )
  service.on('service:read',  data => server.send(data) )
}


let port = process.env['PORT'] || 8080
new HTTPServer({port, handler: handleConnection})
console.log(`Listening for request in ${port}!!`)
