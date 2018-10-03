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
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-deployment
  labels:
    app: python
spec:
  replicas: 1
```

First I change the type of object we want to create from a simple Pod to a Deployment object, why? well because by setting up a deployment controller we can scale up/down or application, at the moment we just want one replica.

```yml
      containers:
      - name: python
        image: python
        command: ["sh", "-c", "cd /tmp/ && git clone https://github.com/cesarvr/demos-webgl demos && cd demos/static/ && python -m http.server 8087"]
        ports:
        - containerPort: 8087
```

Also we need to change the port for the web server, we need to give the control of the port 8080 to the ambassador port. If you check the code above the ambassador expect to tunnel the traffic to the port 8087, this can be configurable but let's leave it hardcoded.

```yml
      - name: sidecar
        image: docker-registry.default.svc:5000/web-apps/ambassador
        command: ["sh", "-c", "npm start"]
        ports:
        - containerPort: 8080
```

And the last step is to setup our ambassador application using 8080 as we mention before. Here is the full template.

```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-deployment
  labels:
    app: python
spec:
  replicas: 1
  selector:
    matchLabels:
      app: python
  template:
    metadata:
      labels:
        app: python
    spec:
      containers:
      - name: python
        image: python
        command: ["sh", "-c", "cd /tmp/ && git clone https://github.com/cesarvr/demos-webgl demos && cd demos/static/ && python -m http.server 8087"]
        ports:
        - containerPort: 8087
      - name: sidecar
        image: docker-registry.default.svc:5000/web-apps/ambassador
        command: ["sh", "-c", "npm start"]
        ports:
        - containerPort: 8080
```

We need to load the template:

```sh
 oc create -f deployable-python-ambassador.yml
```
