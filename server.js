// Dependencies
var fs = require("fs");
var express = require("express");
var http = require("http");
var path = require("path");
var socketIO = require("socket.io");
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set("port", 5000);
app.use("/static", express.static(__dirname + "/static"));
// Routing
app.get("/", function(request, response) {
  response.sendFile(path.join(__dirname, "index.html"));
});
// Starts the server.
server.listen(5000, function() {
  console.log("Starting server on port 5000");
});

const NUM_ROUNDS = 4
const NUM_CARDS = 5
const LANG = get_lang();
var players = {};
var in_game = false;
var num_players = 0;
var round_num = 0;
var num_chosen = 0;
var value = 0;

function get_lang() {
    // grab random lines from file and put in dictionary
    return fs.readFileSync(path.resolve("./") + "/input/google-10000-english.txt", "utf-8").split("\n")
}

io.on("connection", function(socket) {
  socket.on("new_player", function(new_player) {
    let exists = false;
    for (let key in players) {
        if (players[key]["name"] === new_player) {
            exists = true;
        }
    }
    if (!in_game && !exists) {
        num_players += 1;
        players[socket.id] = {"score": 0, "name": new_player};
    }
    socket.emit("received_new_player", !in_game && !exists);
  });

  socket.on("start_game", function() {
    in_game = true;
    // send everyone the players
    let scores = []
    for (let key in players) {
        scores.push([players[key]["name"], players[key]["score"]]);
    }
    io.sockets.emit("results", -1, scores, []);
    begin_game();
  });

  socket.on("card_chosen", function(card_chosen) {
    // check to make sure they actually have that card, and that they haven"t already submitted a card
    if (players[socket.id]["cards"].length != NUM_CARDS) {
        return;
    }

    let valid = false;
    let card_ind = -1;
    for (let i = 0; i < players[socket.id]["cards"].length; i++) {
        if (players[socket.id]["cards"][i][0] === card_chosen) {
            card_ind = i;
            valid = true;
        }
    }
    if (!valid) {
        return;
    }

    num_chosen += 1;
    players[socket.id]["card_chosen"] = players[socket.id]["cards"][card_ind];
    players[socket.id]["cards"].splice(card_ind, 1);
    if (num_chosen == num_players) {
        end_round();
    }
  });

  socket.on("continue", function() {
    if (round_num < NUM_ROUNDS) {
        begin_round();
    }
    else {
        end_game();
    }
  });
});

function begin_game() {
    // grab random lines from file and put in dictionary
    for (let key in players) {
        cards = [];
        for (let i = 0; i < NUM_CARDS - 1; ++i) {
            let rand_num = Math.floor(Math.random() * LANG.length);
            cards.push([LANG[rand_num], rand_num]);
        }
        players[key]["cards"] = cards;

        io.to(key).emit("player_cards", players[key]["cards"].map(c => c[0]).concat(["X"]));
    }
    begin_round();
}

function begin_round() {
    // "value" is random, or are parameters required?
    // deal out one card
    value = Math.ceil(Math.random() * 10);
    for (let key in players) {
        // TODO - Emit to all players
        let rand_num = Math.floor(Math.random() * LANG.length);
        new_card = [LANG[rand_num], rand_num]
        players[key]["cards"].push(new_card);
        io.to(key).emit("new_card", round_num, new_card[0], value)
    }
};

function end_round() {
    let chosen = calculate_scores();
    let scores = [];
    for (let key in players) {
        scores.push([players[key]["name"], players[key]["score"]]);
    }
    io.sockets.emit("results", round_num, scores, chosen);
    round_num += 1;
    num_chosen = 0;
};

// returns list of cards chosen
function calculate_scores() {
    // check dictionary for who had the highest score
    // add appropriate value to top player
    let chosen = [];
    let max_player = "";
    let max_number = 1000000;
    for (let key in players) {
        let card_chosen = players[key]["card_chosen"];
        chosen.push([players[key]["name"], card_chosen[0], card_chosen[1]]);
        if (card_chosen[1] < max_number) {
            max_number = card_chosen[1];
            max_player = key;
        }
    }
    players[max_player]["score"] += value;
    chosen.sort(function(a,b) {
        a = a[2];
        b = b[2];
        return a < b ? -1 : (a > b ? 1 : 0);
    });
    return chosen;
};

function end_game() {
    // reset all values accordingly
    io.sockets.emit("end_game")
    in_game = false;
    num_players = 0;
    round_num = 0;
    players = {};
    num_chosen = 0;
}