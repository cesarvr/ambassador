var net = require('net')


let _error = (err) => console.log('client error: ', err)

function Cache(){
  let endpoints = []

  return{
    save: function(url){
      if(endpoints[url] !== undefined)
        endpoints[url] += 1
      else
        endpoints[url] = 1
    },
    all: function() {
      return endpoints
    }
  }
}

class Parse {
  constructor(){
    this._cache = new Cache()
  }

  extractEndPoint(str){
    return str.replace("GET", "")
      .replace("HTTP\/1.1","")
      .trim()
  }

  process(data) {
    let str = data.toString()
    let http_method = str.split('\n')[0]

    let endpoint = this.extractEndPoint(http_method)
    console.log('HTTP->', endpoint)

    this._cache.save(endpoint)
    return data
  }

  get cache() {
    return this._cache
  }
}

class Tunel {
  constructor({port}) {
    const _identity = (a) => { return a }

    this._incoming  = _identity
    this._outcoming = _identity

    this.destinationSocket = new net.Socket()
    this.destinationSocket.connect(port || 8087, '0.0.0.0', function() {
      console.log(`connected to ${port}`)
    })
  }

  setup({originSocket}) {
    this.destinationSocket.on('data', (data) => {
      originSocket.write(this._outcoming(data) )
    })

    originSocket.on('data', (data) => this.destinationSocket.write(this._incoming(data)))
    originSocket.on('end', this.closeConnections.bind(this))
    this.destinationSocket.on('error', _error)
    originSocket.on('error', _error)
    this.originSocket = originSocket
  }

  closeConnections(){
    console.log('closing tunnel')
    this.originSocket.end()
    this.destinationSocket.end()
  }

  set incoming(fn) {
    this._incoming = fn
  }

  set outcoming(fn) {
    this._outcoming = fn
  }
}

console.log('listening 8080...')

let parse = new Parse()
setInterval(()=>{ console.log("cache: ",parse.cache.all())}, 2000 )

net.createServer(function (socket) {
  console.log('new connection!')

  let tunel = new Tunel({port: 8087})

  tunel.incoming = parse.process.bind(parse)

  tunel.setup({originSocket: socket})

}).listen(8080)
