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

server.listen(process.env.PORT ||3900);



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
                    return res.status(400).json({message: "Internal server error"});
                }
                else {
                    return res.status(255).json({message: "Account created"});


                }

            })
       }
       else {
return res.status(400).json({message: "User already exists"});


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
                res.status(421).json({message: "User not found"});
            }
        })
    }
});



var queueOfPlayers = [];
var playingPlayers = [];

var SOCKET_LIST = [];
var count = 0;


io.on('connection', function(socket){
    socket.id = Math.random();
    socket.score = 0;


  //  socket.emit('info', {opponent:"lol"};)

    console.log('a user connected');

    socket.on('disconnect', function() {

        console.log("user disconnected")

    });



    socket.on('submit',function (data) {

        var cookies = cookie.parse(socket.request.headers.cookie);

        var index;
        for(var i = 0; i<playingPlayers.length;i++) {

            if(cookies.token === playingPlayers[i].token) {
                index= i;
                break;


            }
        }


        if(index>=playingPlayers.length) {

            //Somebody tries to hack in to my app.
                return;
        }

        if(playingPlayers[index].num ===1) {
            playingPlayers[index].A = true;
            playingPlayers[index].num++;

        }
        else if(playingPlayers[index].num ===2) {
            playingPlayers[index].B=true;
            playingPlayers[index].num++;


        }
        else if(playingPlayers[index].num ===3) {
            playingPlayers[index].C=true;
            playingPlayers[index].num++;


        }
        else if(playingPlayers[index].num ===4) {
            playingPlayers[index].num++;
            playingPlayers[index].D=true;

        }

        var index2;

        var opp = playingPlayers[index].opponent;
        for(var i = 0; i<playingPlayers.length;i++) {

            if(opp === playingPlayers[i].name) {
                console.log("found!");
                index2= i;
                break;
            }
        }






    });

    socket.on('wantToPlay',function (data) {
        socket.name = data;

        socket.score =0;

        socket.num = 1;

        socket.A=false;
        socket.B=false;
        socket.C=false;
        socket.D=false;


        var cookies = cookie.parse(socket.request.headers.cookie);
        socket.token = cookies.token;
        console.log(queueOfPlayers.length);

        if(queueOfPlayers.length === 0) {

            queueOfPlayers.push(socket);
        }
        else {
            queueOfPlayers[0].opponent = socket.name;
            socket.opponent = queueOfPlayers[0].name;
            playingPlayers.push( queueOfPlayers[0]);
            playingPlayers.push(socket);




            var lol = "fjdsiogjdfoigjiodfgjdfgojoidrjgiodfjiogijofd";
            var object = {question:lol,A:"norm",
                    B:"good",C:"very good",
                D:"bad", opponent: queueOfPlayers[0].name

            };
            var object2 = {question:lol,A:"norm",
                B:"good",C:"very good",
                D:"bad", opponent: socket.name};


            socket.emit('play',object);
            queueOfPlayers[0].emit('play',object2);

            queueOfPlayers.splice(0);



        }




    });

    socket.emit('serverMsg', "hey")

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








