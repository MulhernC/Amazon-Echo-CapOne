var express = require('express');        
var app = express();                 
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        
var router = express.Router();              

router.get('/', function(req, res) {
    id = req.params.id
    res.json({ message: "testing api" });   
});
app.use('/api', router);
app.listen(port);
