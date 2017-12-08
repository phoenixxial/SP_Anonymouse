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


app.post('/new',function (req,res) {

 {
    var{quest,A,B,C,D,ans} = req.body;

    var query = "INSERT INTO QUESTIONS VALUES (?,?,?,?,?,?)";
     var data = [quest,A,B,C,D,ans];
     console.log("her");
     db.run(query,data,function (err,rows) {
         console.log("her");


         res.status(255).json({message: "success!"});
     })

     }

});


app.get('/admin',function (req,res) {

    var cookies = cookie.parse(req.headers.cookie);

    if (cookies.token === undefined) {
        return res.sendFile(__dirname + '/login.html')
    }
    else {
        var que = "SELECT* " +
            "FROM USERS WHERE AuthToken = ?";
console.log(cookies.token);
        db.all(que,[cookies.token],function (err,rows) {
            if(rows!== undefined && rows!== null && rows[0].ACCESS===2) {
                console.log("huy");
                res.status(255).json({message:"admin"});
            }
            else {
                res.status(256).json({message:"user"});

            }

        })

    }

});




app.get('/', function(req, res){
    console.log("haha");
   return res.sendFile(__dirname+'/login.html')

});


app.get('/history', function(req, res) {
    var cookies = cookie.parse(req.headers.cookie);

    if (cookies.token === undefined) {
        return res.sendFile(__dirname + '/login.html')
    }

    else {

        var {name} = req.query;


        var que = "SELECT* FROM HISTORY WHERE FIRST = ? OR SECOND = ? LIMIT 20"

        db.all(que,[name,name],function (err,rows) {
            return res.status(200).json(rows);

        })


    }
});



app.get('/client', function(req, res){
    var cookies = cookie.parse(req.headers.cookie);

    if(cookies.token === undefined) {
        return res.sendFile(__dirname+'/login.html')
    }
    else {
        checkToken(cookies.token,res,"/client.html");

    }
    //Check if cookie is valid on the server :)

});


app.get('/stats.html',function (req,res) {


    var cookies = cookie.parse(req.headers.cookie);

    if(cookies.token === undefined) {
        return res.sendFile(__dirname+'/login.html')
    }
    else {
        checkToken(cookies.token,res,"/stats.html");

    }

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



    var cookies = cookie.parse(socket.request.headers.cookie);
    if(queueOfPlayers[0]!== undefined && queueOfPlayers[0].token === cookies.token ) {

        return;

    }


    for(var k = 0; k < playingPlayers.length; k++) {
        if(playingPlayers[k].token === cookies.token) {
            return;

        }
    }

    socket.id = Math.random();
    socket.score = 0;


  //  socket.emit('info', {opponent:"lol"};)

    console.log('a user connected');

    socket.on('disconnect', function() {

        console.log("user disconnected")

    });



    socket.on('submit',function (data) {

        var cookies = cookie.parse(socket.request.headers.cookie);

        var index=-1;
        for(var i = 0; i<playingPlayers.length;i++) {

            if(cookies.token === playingPlayers[i].token) {
                index= i;
                break;


            }
        }


        if(index>=playingPlayers.length || index <0) {

            //Somebody tries to hack in to my app.
                return;
        }

        if(playingPlayers[index].num ===1) {
            if(data.ans ===playingPlayers[index].answer) {
                playingPlayers[index].score++;
            }
            playingPlayers[index].A = true;
            playingPlayers[index].num++;

        }
        else if(playingPlayers[index].num ===2) {
            if(data.ans ===playingPlayers[index].answer) {
                playingPlayers[index].score++;
            }
            playingPlayers[index].B=true;
            playingPlayers[index].num++;


        }
        else if(playingPlayers[index].num ===3) {
            if(data.ans ===playingPlayers[index].answer) {
                playingPlayers[index].score++;
            }
            playingPlayers[index].C=true;
            playingPlayers[index].num++;


        }
        else if(playingPlayers[index].num ===4) {
            if(data.ans ===playingPlayers[index].answer) {
                playingPlayers[index].score++;
            }
            playingPlayers[index].num++;
            playingPlayers[index].D=true;

        }

        var index2;

        var opp = playingPlayers[index].opponent;
        for(var i = 0; i<playingPlayers.length;i++) {

            if(opp === playingPlayers[i].name) {
                index2= i;
                break;
            }
        }





        if(playingPlayers[index].D===true &&  playingPlayers[index2].D===true ){




            const message1 = "victory";
            const message2 = "defeat";
            const message3 = "draw";

            var toSend1;
            var toSend2;

            if(playingPlayers[index].score>playingPlayers[index2].score) {
                toSend1 = message1;
                toSend2 = message2;

            }
            else if(playingPlayers[index2].score >playingPlayers[index].score) {
                toSend1 = message2;
                toSend2 = message1;

            }
            else {
                toSend1 = message3;
                toSend2 = message3;
            }






            playingPlayers[index2].emit('next',{finale:toSend2});
            playingPlayers[index].emit('next',{finale:toSend1})


            var seq = "INSERT INTO HISTORY VALUES(?,?,?,?)";
            var data = [  playingPlayers[index].name,   playingPlayers[index2].name,   playingPlayers[index].score,
                playingPlayers[index2].score];


            db.run(seq,data,function(data,err) {


            });




            playingPlayers.splice(index2,1);
            playingPlayers.splice(index,1);

            //  playingPlayers[index].emit('next', {score:playingPlayers[index].score})

        }

       else if(playingPlayers[index].C===true && playingPlayers[index2].C===true &&(playingPlayers[index].D!==true)) {



            var quer = "SELECT* FROM Questions ORDER BY RANDOM() LIMIT 1 ";


            db.all(quer, [],function (err, rows) {


                var object = {
                    question: rows[0].Question, A: rows[0].A,
                    B: rows[0].B, C: rows[0].C,
                    D: rows[0].D, yourScore: playingPlayers[index].score,
                    hisScore: playingPlayers[index2].score

                };
                var object2 = {
                    question: rows[0].Question, A: rows[0].A,
                    B: rows[0].B, C: rows[0].C,
                    D: rows[0].D, yourScore: playingPlayers[index2].score,
                    hisScore: playingPlayers[index].score
                };

                playingPlayers[index2].answer = rows[0].ANSWER;
                playingPlayers[index].answer = rows[0].ANSWER;

                playingPlayers[index].emit('next', object);
                playingPlayers[index2].emit('next', object2);

            })



        }


else        if(playingPlayers[index].B===true && playingPlayers[index2].B===true &&(playingPlayers[index].C!==true)) {


            var quer = "SELECT* FROM Questions ORDER BY RANDOM() LIMIT 1 ";


            db.all(quer, [],function (err, rows) {


                var object = {
                    question: rows[0].Question, A: rows[0].A,
                    B: rows[0].B, C: rows[0].C,
                    D: rows[0].D, yourScore: playingPlayers[index].score,
                    hisScore: playingPlayers[index2].score

                };
                var object2 = {
                    question: rows[0].Question, A: rows[0].A,
                    B: rows[0].B, C: rows[0].C,
                    D: rows[0].D, yourScore: playingPlayers[index2].score,
                    hisScore: playingPlayers[index].score
                };

                playingPlayers[index2].answer = rows[0].ANSWER;
                playingPlayers[index].answer = rows[0].ANSWER;

                playingPlayers[index].emit('next', object);
                playingPlayers[index2].emit('next', object2);

            })



        }

     else   if(playingPlayers[index].A===true && playingPlayers[index2].A===true &&(playingPlayers[index].B!==true)) {

            var quer = "SELECT* FROM Questions ORDER BY RANDOM() LIMIT 1 ";


            db.all(quer, [],function (err, rows) {


                var object = {
                    question: rows[0].Question, A: rows[0].A,
                    B: rows[0].B, C: rows[0].C,
                    D: rows[0].D, yourScore: playingPlayers[index].score,
                    hisScore: playingPlayers[index2].score

                };
                var object2 = {
                    question: rows[0].Question, A: rows[0].A,
                    B: rows[0].B, C: rows[0].C,
                    D: rows[0].D, yourScore: playingPlayers[index2].score,
                    hisScore: playingPlayers[index].score
                };

                playingPlayers[index2].answer = rows[0].ANSWER;
                playingPlayers[index].answer = rows[0].ANSWER;

                playingPlayers[index].emit('next', object);
                playingPlayers[index2].emit('next', object2);

            })



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




            var quer = "SELECT* FROM Questions ORDER BY RANDOM() LIMIT 1 ";


            db.all(quer, [],function (err, rows) {



                var lol = "fjdsiogjdfoigjiodfgjdfgojoidrjgiodfjiogijofd";
                var object = {question:rows[0].Question,A:rows[0].A,
                    B:rows[0].B,C:rows[0].C,
                    D:rows[0].D, opponent: queueOfPlayers[0].name

                };
                var object2 = {question:rows[0].Question,A:rows[0].A,
                    B:rows[0].B,C:rows[0].C,
                    D:rows[0].D, opponent: socket.name};

                queueOfPlayers[0].answer = rows[0].ANSWER;
                socket.answer=rows[0].ANSWER;

                playingPlayers.push( queueOfPlayers[0]);
                playingPlayers.push(socket);

                socket.emit('play',object);
                queueOfPlayers[0].emit('play',object2);

                queueOfPlayers.splice(0);


            });








        }




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


function checkToken(token,res,stringa) {

        var currentQuery = "SELECT* FROM USERS WHERE AuthToken = ?";
        db.all(currentQuery,[token], function(err, rows) {
            if (rows !== null && rows !== undefined && rows.length !== 0) {
                return res.sendFile(__dirname + stringa)

            }
            else{
                return res.sendFile(__dirname + './')
            }
        })

}








