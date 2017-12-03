var express = require('express');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);




var sqlite3 = require('sqlite3').verbose()
    ,TransactionDatabase = require("sqlite3-transactions").TransactionDatabase;

var bodyParser = require('body-parser');

var async = require('async');
const uuidv4 = require('uuid/v4');

var cookie = require('cookie');

var cors = require('cors');
var db = new TransactionDatabase(new sqlite3.Database('Data/Data.db'));


app.use(cors());
app.use(bodyParser.urlencoded({
    extended:true}));

app.use(bodyParser.json());
app.use("/assets",express.static(__dirname + '/assets'));

app.use(express.static(__dirname + '/node_modules'));

server.listen(3900);



users = [];
connections = [];




app.get('/', function(req, res){
    console.log("haha");
   return res.sendFile(__dirname+'/login.html')

});

app.get('/client', function(req, res){
    var cookies = cookie.parse(req.headers.cookie);

    if(cookies.token === undefined) {
        return res.sendFile(__dirname+'/login.html')
    }
    else {
        checkToken(cookies.token,res);

    }
    //Check if cookie is valid on the server :)

});





//Registering a new user

app.post("/register", function (req,res) {
   var {ID, password} = req.body;




    if(ID === null || password === null || ID === "" || password === "" || ID === undefined
        || password === undefined) {
        return res.status(400).json(
            {message: "invalid_data"}
        )

    }


    var currentQuery = "SELECT* FROM USERS WHERE UserPassword= '"+password+"' AND UserID = '"+ID+"' ";
    db.all(currentQuery,[], function(err, rows) {

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






app.post("/signin",function (req,res) {

    var {ID, password} = req.body;

    if(ID === null || password === null || ID === "" || password === "" || ID === undefined
        || password === undefined) {
        return res.status(400).json(
            {message: "invalid_data"}
        )

    }
    else {

        var currentQuery = "SELECT* FROM USERS WHERE UserPassword= '"+password+"' AND UserID = '"+ID+"' ";
        db.all(currentQuery,[], function(err, rows) {

            if (rows !== null && rows !== undefined && rows.length !== 0) {
                registerToken(ID,res);
            }
            else{

                res.status(200).json({message: "User not found"});
            }
        })
    }
});


io.on('connection', function(socket){


    console.log('a user connected');

    socket.on('disconnect', function() {

        console.log("user disconnected")

    });

});


function registerToken(userID,res) {
    var myQuer = 'UPDATE Users SET AuthToken = ?, AuthTokenIssued = ? WHERE UserId = ?';


    let token = uuidv4();
    let date = Date.now();
    let data = [token,date,userID];
    db.run(myQuer, data,function(err) {
        if(err) {
            return res.status(500).json(
                {message: "Internal server error"});
        }
        else {

            return res.status(200).json({message: "success",authToken:token});
        }
    });
}


function checkToken(token,res) {

        var currentQuery = "SELECT* FROM USERS WHERE AuthToken = ?";
        db.all(currentQuery,[token], function(err, rows) {
            if (rows !== null && rows !== undefined && rows.length !== 0) {
                return res.sendFile(__dirname + '/client.html')

            }
            else{
                return res.sendFile(__dirname + '/login.html')
            }
        })

}








