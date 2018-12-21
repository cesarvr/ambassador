
class Pod {
  constructor() {
    this.os = require('os')
  }

  host() {
    return this.os.hostname()
  }

  get resources() {
    return {
      free_memory: this.os.freemem(),
      total_memory: this.os.totalmem(),
      cpus: this.os.cpus()
    }
  }
}

class Stats {
  constructor() {
    this.close = false
  }

  isFile(endpoint) {
     const file_regexp = /\.[0-9a-z]+$/i
     return endpoint.search(file_regexp) !== -1
   }

   get sample() {
       return {
         endpoint: this.endpoint,
         method: this.method,
         response: this.response,
         time: this.end,
         started: this.start,
         file: this.isFile(this.endpoint),
       }
   }

   waiting(){
     return !this.close
   }

   finish(){
     this.close = true
   }

   readResponse(response) {
     this.response = response
     return this
   }

   readRequest(header) {
     this.method = header.HTTPMethod
     this.endpoint = header.HTTPResource

     return this
   }

   startProfile() {
     this.start = new Date().getTime()
     return this
   }

   endProfile() {
     this.end = new Date().getTime() - this.start
     return this
   }
 }

 module.exports = {Stats, Pod}
