let { Service, Server } =  require('node-ambassador')
//let { Service, Server } =  require('../ambassador')

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

  getEndPoint(http_block) {
    let str = http_block.split('\n')[0]

    str = str.split(' ')

    let HTTPMethod   = str[0].trim() // [ GET ] /home HTTP1.1..
    let HTTPResource = str[1].trim() // GET [ /home ] HTTP1.1..

    return { HTTPMethod, HTTPResource }
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

  read(httpHeader){
    let head = httpHeader.toString()
    let RequestComponents = this.getEndPoint(head)

    this.method   = RequestComponents.HTTPMethod
    this.endpoint = RequestComponents.HTTPResource
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
  let service = new Service({port: process.env['PORT'] || 8087})
/*
 service.on('service:response:200', response => server.respond(response) )
  service.on('service:response:404', response => server.respond([HTTP404]) ) */

  server.on('server:traffic', incomingData => stats.read(incomingData))
  server.on('server:traffic', incomingData => stats.start_profile())
  service.on('service:response:all', (status, data) => stats.end_profile())
  service.on('service:response:all', (status, data) => stats.new_entry())

  server.on('server:traffic', incomingData => service.send(incomingData))
  service.on('service:response:200', response => server.respond(response) )
  service.on('service:response:404', response => server.respond([HTTP404]) )
}

new Server({port: 8080, handler: handleConnection})
console.log('Listening for request in 8080!!')
