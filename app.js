const { Stats, Pod } = require('./monitor')
const { DB } = require('./db')
const { Notify }  = require('./notify')
const { HTTP404 } = require('./responses')
const { Ambassador }  = require('node-ambassador')

let db = new DB()
let pod = new Pod()

setInterval(() => {
  let payload = {
    pod: pod.host(),
    stats: db.all
  }

  console.log(`queue: ${db.size()}`)
  if(db.size() > 0) {
    let notify = new Notify({ endpoint: 'stats' })

    notify.send({ payload })
      .then(()   => db.clear() )
      .catch(err => console.log('dashboard: stats endpoint not available'))
  }
}, 5000)

setInterval(() => {

  let payload = {
    pod: pod.host(),
    resource: pod.resources
  }

  let notify = new Notify({ endpoint: 'resources' })

  notify.send({ payload })
        .catch( err => console.log('dashboard: resources endpoint not available') )
}, 1000)


function telemetry({service, server}) {
  let stats = new Stats()

  server.on('http:data',  (header)       => stats.readRequest(header)
                                                 .startProfile())

  service.on('http:data', (header, data) => stats.readResponse(header,data)
                                                 .endProfile()
                                                 .finish())
  db.save(stats)
}

function override_404({service, server}) {
  service.on('http:404', () => console.log('404 Detected!'))
  service.on('http:404', () => server.respond(HTTP404))
}

const TARGET = process.env['TARGET_PORT'] || 8087
const PORT   = process.env['PORT'] || 8080

new Ambassador({port: PORT, target: TARGET})
    .tunnel({override_404, telemetry })

console.log(`listening for request in ${PORT} and targeting ${TARGET}`)
