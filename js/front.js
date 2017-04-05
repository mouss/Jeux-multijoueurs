'use strict';
(function(window, io){


window.addEventListener('load',function(){

    var j = 0;

    var socket = io('http://127.0.0.1:8080/');

    var pseudo;

      socket.emit('petit_nouveau', pseudo);
      socket.on('identite', function(data){
        pseudo = data;
      });

  // draw new square or updates an existing square
  var draw = function(data) {
    var square = document.getElementById(data.id);
    if (!square) {
      square = window.document.createElement('div');
      square.id = data.id;
      square.style.width = data.width;
      square.style.height = data.height;
      square.style.position = 'absolute';
      document.getElementById("game").appendChild(square);

    }
    square.style.top = data.top;
    square.style.left = data.left;
    square.style.backgroundColor = data.backgroundColor;
  };
  var rond = function(data) {
    var moncercle = window.document.getElementById(data.id);
    if (!moncercle) {
      moncercle = window.document.createElement('div');
      moncercle.id = data.id;
      moncercle.style.width = data.width;
      moncercle.style.height = data.height;
      moncercle.style.borderRadius = 50 + 'px';
      moncercle.style.position = 'absolute';
      moncercle.addEventListener("mouseover", function(data){
        var mouseEvent = {
          id:data.target.id,
          pseudo:pseudo,
        };

        socket.emit('user_score',  mouseEvent);
      });
      document.getElementById("game").appendChild(moncercle);

    }
    moncercle.style.top = data.top;
    moncercle.style.left = data.left;
    moncercle.style.backgroundColor = data.backgroundColor;
  };

  socket.on('update', function(data){
    draw(data);
  });

  socket.on('create', function(data){
      rond(data)
  });

  socket.on('destroy', function(data){
    var avatar = window.document.getElementById(data.data.id);
    if (avatar) {
      avatar.remove();
    }
  });

  socket.on('username', function(data){
    var node = document.createElement("p");
    var textnode = document.createTextNode(data.user);
    node.appendChild(textnode);
    document.getElementById(data.id).appendChild(node);
  });

  socket.on('list_users', function(data){
    var tableauUser = document.createElement("table");
    var tr = document.createElement('tr');
    var thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Pseudo</th><th>Temps</th><th>Meilleur Score</th></tr>';
    tableauUser.appendChild(thead);
    for (let i = 0; i < data.listes.length; i++)
    {
      tr[i] = document.createElement('tr');
      var td1 = document.createElement('td');
      //var td2 = document.createElement('td');
      var td3 = document.createElement('td');
      var td4 = document.createElement('td');
      td1.appendChild(document.createTextNode(data.listes[i].identifiant));
      //td2.appendChild(document.createTextNode(data.listes[i].score));
      td3.appendChild(document.createTextNode(data.listes[i].temps));
      td4.appendChild(document.createTextNode(data.listes[i].meilleurScore));
      tr[i].appendChild(td1);
      //tr[i].appendChild(td2);
      tr[i].appendChild(td3);
      tr[i].appendChild(td4);
      tableauUser.appendChild(tr[i]);
    }
      document.getElementById("top_score").appendChild(tableauUser);
  });

  socket.on('nombre_client', function(data){
    document.getElementById("nombre_client").innerHTML = data;
  });

  socket.on('remove_cercle', function(data){
    var monRond = document.getElementById(data.id);
    if(monRond){
      monRond.remove();
    }
  });

  socket.on('maj_score', function(data){
   document.getElementById("score").innerHTML = data.score;
  });


  document.getElementById("game").addEventListener('mousemove', function(event){
    var gameWidth = document.getElementById('game').offsetWidth + document.getElementById('sidebar').offsetWidth + ((document.body.offsetWidth -  document.getElementById('container').offsetWidth) / 2) - 15;
    var gameHeight = document.getElementById('game').offsetHeight - 15;

    if(event.clientX < gameWidth && event.clientY < gameHeight){
      socket.emit('move', {
        top: event.clientY - 15,
        left: event.clientX -15
      });
    }
  });

});

})(window, io);
