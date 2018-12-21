const fetch = require('node-fetch')

class Notify {
  constructor ({ endpoint }) {
    this.URL = `${process.env['MOTHERSHIP']}/${endpoint}`
  }

  send({payload}) {
    if(this.URL !== '')
        return fetch(this.URL, {
          method: 'post',
          body:    JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' }
        })
        .then(res => res.json())
  }
}


module.exports = { Notify }
