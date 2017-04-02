/**
  Le Serveur HTTP.
  URL : http://[adresse IP/nom de domaine]:8888/

  Ce serveur produit une réponse HTTP contenant un document
  HTML suite à une requête HTTP provenant d'un client HTTP.
**/

// Chargement d'express
var express = require('express');

// Création d'un application principale express
var app = express();

var MongoClient = require('mongodb').MongoClient;
var URL = 'mongodb://localhost:27017/multijoueur';
var maDB;
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var session = require('express-session');
var bcrypt = require('bcryptjs');
var userPseudo;

app.use("/pug", express.static(__dirname + '/pug'));
app.set('view engine', 'pug')
app.set('views','pug');
app.use("/img", express.static(__dirname + '/img'));
app.use("/css", express.static(__dirname + '/css'));
app.use("/js", express.static(__dirname + '/js'));


app.use(urlencodedParser);
app.use(session({
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  secret: 'shhhh, very secret',
}));


MongoClient.connect(URL, function(err, db) {
  if (err) {
    return;
  }

  maDB = db;

// var port = process.env['PORT'] || 80;

// Démarrage du serveur pour l'application principale express
var server = app.listen(8888, function() {
  console.log( 'Server listening on port 8888 ');
});
app.get('/', function(req,res){
  res.render('accueil.pug');

});
app.get('/jeu', function(req,res){
   if(req.session.user){
     res.render('index2.pug');
   }else{
     res.render('accueil.pug');
   }
});
app.post('/jeu', function (req, res) {
//pseudo = req.body.login;
  var collection = maDB.collection('utilisateurs');
  collection.find({ identifiant: req.body.login }).toArray(function(err, data){
      if(data == ''){
        res.render('accueil.pug', {reponse:'Login invalide'});
      }else if( bcrypt.compareSync(req.body.motdepasse, data[0].motdepasse)){
         userPseudo = data[0].identifiant;
        res.render('index2.pug');
      }else {
        res.render('accueil.pug', {reponse:'Mot de passe invalide'});
      }

    });
});

app.get('/inscription', function(req,res){
     res.render('inscription.pug');
});

app.post('/inscription', function (req, res) {
    var hash = bcrypt.hashSync(req.body.motdepasse, 10);
    var collection = maDB.collection('utilisateurs');

    collection.find({ identifiant: req.body.login }).toArray(function(err, data){
        if(data == ''){
          collection.insert({ identifiant: req.body.login, motdepasse: hash, score: 0, temps: 0, meilleurScore:0 });
          res.render('accueil.pug', {reponse:'Connectez-vous avec login est mdp'});
        }else  {
          res.render('inscription.pug', {response:'Login déjà utilisé'});
        }

      });

});



app.use(function(req, res, next) {
  res.status(404).render('page404.pug');
});




var guid = function () {
  var s4 = function () {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  }
  return (s4() + s4() + "-" + s4() + "-4" + s4().substr(0,3) + "-" + s4() + "-" + s4() + s4() + s4()).toLowerCase();
};

var color = function() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

var socketIo = require('socket.io');

var io = socketIo(server);
var numClients = 0;

var mesCercles = [];
io.on('connection', function (socket, pseudo) {
numClients++;
var player = {}
  var data = {
    id: guid(),
    top: '0px',
    left: '0px',
    width: '30px',
    height: '30px',
    backgroundColor: color()
  }
  function getcercle(){
    var cercle = {
      id: guid(),
      top: Math.floor((Math.random() * 551)) + 'px',
      left: Math.floor((Math.random() * 600) + 377) + 'px',
      width: '50px',
      height: '50px',
      backgroundColor: color()
    }
    return cercle;
  }
  for(var i = 0; i<10; i++){
    mesCercles.push(getcercle())
  }

  socket.on('petit_nouveau', function(pseudo){

    player.user = userPseudo;
    player.score = 0;
    player.temps = new Date().getTime();
    player.data = data;
    //player.session = pseudo;
    io.emit('nombre_client', numClients);
    io.emit('update', player.data);
    socket.emit('identite', player.user);
    mesCercles.forEach(function(element) {
    io.emit('create', element);
  });

    var collection = maDB.collection('utilisateurs');
    collection.find({ identifiant: player.user }).toArray(function(err, data){

        if(data == ''){
          //collection.insert({ identifiant: player.user, score: 0, temps: 0, meilleurScore:0 })
            io.emit('username', {user : player.user, id: player.data.id });
          collection.find({}).toArray(function(err, data){
            socket.emit('list_users', {listes : data});
          });
        }else if( data[0].identifiant == player.user ){
          console.log(data)
          collection.find({}).toArray(function(err, data){
            socket.emit('list_users', {listes : data });
          });
          io.emit('username', {user : player.user, id: player.data.id });

        }

      });

  });




  socket.on('user_score', function(data) {
    var collection = maDB.collection('utilisateurs');
    collection.updateOne({identifiant:data.pseudo}, {$inc:{score:1}});
    player.score++;
    socket.emit('maj_score', { score: player.score });
    io.emit('remove_cercle', { id: data.id });

  });

  socket.on('move', function(position) {

    data.top = parseFloat(position.top) + 'px';
    data.left = parseFloat(position.left) + 'px';

    io.emit('update', data);

  });


  socket.on('disconnect', function(data){
     numClients--;
     var collection = maDB.collection('utilisateurs');
     collection.find({ identifiant: player.user }).toArray(function(err, data){
       if(data == ''){
         console.log('personne');
       } else if(data[0].score > data[0].meilleurScore){
         console.log('meilleurScore');
         collection.update({identifiant:data[0].identifiant},
           { $set: { meilleurScore: data[0].score, score: 0, temps:Math.floor((Date.now()-player.temps) / 1000) % 60 + ' sec' } });
       }else {
         console.log('ResetScore');
         collection.update({identifiant:data[0].identifiant},
           { $set: {  score: 0 } });
       }
     });

     io.emit('nombre_client', numClients);
    // io.emit('list_user', users);

    io.emit('destroy', player);
    console.log('user disconnected' );

  });


});
});
