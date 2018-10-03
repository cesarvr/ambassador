# First

Now I want to check the content that comes from the outside, let see whats comming back, we're going to achieve this by creating an adaptor that scan the data and pass it back to the socket.

```js
function process(data) {
  console.log(data.toString());

  return data
}

socket.on('data', (data) => this.client.write(process(data)))

```

```sh
GET /fire_1/ HTTP/1.1
Host: localhost:8088
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:62.0) Gecko/20100101 Firefox/62.0
Connection: keep-alive
...
```
To create the visitors counter I need too bookeep the browser request for the URL just want to keep GET request, so I going to create a rudimentary counter.

```js
function process(data) {
  let str = data.toString()
  let http_method = str.split('\n')[0]

  console.log('HTTP->', http_method)
  return data
}
```


I just wanted to hide the complexity of proxying and socket behind the class tunel which implement to method that we can to handle the outcomming/incomming traffic, look at the example.


```js

console.log('listening 8080...')

net.createServer(function (socket) {
  console.log('new connection!')
  let registry = new Registry()

  let tunel = new Tunel({port: 8087})
  tunel.incoming = function(o){
    console.log('out->' , o.toString())
    return o
  }

  tunel.setup({socket})

}).listen(8080)

```

Now let handle the incomming traffic by encapsulating the two behaviours we want in to classes, we want to *parse* and *cache* the amount of time our endpoint is being called.


```js
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
```

This class will do the job of keeping the count of how many times the endpoint is being called.


## Parse

```js
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
```


Using this stuff you can implement a configurable circuit breaker, this way you never need to mix business logic with all this stuff.




Let's print our statistics in the console:


```js
console.log('listening 8080...')

let parse = new Parse()
setInterval(()=>{ console.log("cache: ",parse.cache.all())}, 2000 )

net.createServer(function (socket) {
  console.log('new connection!')

  let tunel = new Tunel({port: 8087})

  tunel.incoming = parse.process.bind(parse)

  tunel.setup({socket})

}).listen(8080)
```




I got here almost what I wanted but I'm not satisfied lets write a small dashboard to control our gather this information in a civilize way.




# Implementation

We need to put this application inside a container first, I'll use a BuildConfig to do this:  

```sh
oc new-build nodejs~https://github.com/cesarvr/ambassador --name=ambassador

oc logs -f bc/ambassador
Cloning "https://github.com/cesarvr/ambassador" ...
	Commit:	014567aa091d48b25e59bb97c6fe6e5ba3827779 (initial)
...
Pulling image
...
Pushing image docker-registry.default.svc:5000/web-apps/ambassador:latest ...
Pushed 2/6 layers, 34% complete
...
...
Pushed 6/6 layers, 100% complete
Push successful

```

This will create a container named ambassador ready to be deployed. Now the only thing left is to put the ambassador container in front of our dumb Python server to do that we need to make some changes to the original template. 

```yml

```
