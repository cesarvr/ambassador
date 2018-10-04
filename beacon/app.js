const express = require('express')
const app = express()
const port = 3000

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))

app.post('/beacon', (req, res) => { 
  let body = req.body
  console.log('body->' , body)
  console.log('body->' , req.params)

  res.status(200).send({response: 'ok'})
})  

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
