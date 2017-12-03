var express = require('express');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);




var sqlite3 = require('sqlite3').verbose()
    ,TransactionDatabase = require("sqlite3-transactions").TransactionDatabase;

var bodyParser = require('body-parser');

var async = require('async');
const uuidv4 = require('uuid/v4');

var cors = require('cors');
var db = new TransactionDatabase(new sqlite3.Database('Data/Data.db'));

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


//Registering a new user

app.post("/register", function (req,res) {
   var {ID, password} = req.body;

   console.log(ID);
   console.log(password);


    if(ID === null || password === null || ID === "" || password === "" || ID === undefined
        || password === undefined) {
        return res.status(400).json(
            {message: "invalid_data"}
        )

    }


    var currentQuery = "SELECT* FROM USERS WHERE UserPassword= '"+password+"' AND UserID = '"+ID+"' ";
    db.all(currentQuery,[], function(err, rows) {
        console.log(err);

        console.log("heya");
        if(rows === null || rows === undefined || rows.length===0) {


            var ques = "INSERT INTO Users Values (?,?,?,?)";
            var data = [ID,password,null];
            db.run(ques,data,function (err) {

                if(err) {
                    console.log(err);
                }
                else {
                    console.log("success");

                }

            })
       }
       else {




        }

    });



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


