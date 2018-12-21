class DB {
  constructor(){
    this.db = []
  }

  save(obj){
    this.db.push( obj )
  }

  size(){
    return this.db.length
  }

  clear() {
    this.db = this.db.filter(obj => obj.waiting())
  }

  get all() {
    console.log('all: ',this.db.filter(obj => !obj.waiting()))
    return this.db.filter(obj => !obj.waiting()).map(obj => obj.sample)
  }
}

 module.exports = { DB }
