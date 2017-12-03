var express = require('express');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);




var sqlite3 = require('sqlite3').verbose()
    ,TransactionDatabase = require("sqlite3-transactions").TransactionDatabase;

var bodyParser = require('body-parser');

var async = require('async');
const uuidv4 = require('uuid/v4');

var cors = require('cors');
var db = new TransactionDatabase(new sqlite3.Database('ProjectA.db'));

var app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended:true}));

app.use(bodyParser.json());

users = [];
connections = [];




app.get('/', function(req, res){
    console.log("haha");
   return res.sendFile(__dirname+'/login.html')

});


app.post("/signin", function (req,res) {
    var {name} = req.body;
    console.log(name);
return res.status(200).json({message: "good job"});

});


app.get("/login",function (req,res) {

    res.sendFile(__dirname+'/client.html');
});


io.on('connection', function(socket){


    console.log('a user connected');

    socket.on('disconnect', function() {

        console.log("user disconnected")

    });

});









var port = process.env.PORT || 3900;
var server = app.listen(port, function() {
    console.log("App listening on port"+ port);


});


