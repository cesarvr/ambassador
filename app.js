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

    this.client = new net.Socket()
    this.client.connect(port || 8087, '0.0.0.0', function() {
      console.log(`connected to ${port}`)
    })
  }

  setup({socket}) {
    this.client.on('data', (data) => {
      socket.write(this._outcoming(data) )
    })

    socket.on('data', (data) => this.client.write(this._incoming(data)))
    //socket.on('end', this.client.end)
    this.client.on('error', _error)
    socket.on('error', _error)
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

  tunel.setup({socket})

}).listen(8080)
