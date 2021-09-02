// dependencies
var fs = require("fs");
var express = require("express");
var http = require("http");
var path = require("path");
var socketIO = require("socket.io");
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set("port", process.env.PORT || 5000);
app.use("/static", express.static(__dirname + "/static"));
// routing
app.get("/", function (request, response) {
    response.sendFile(path.join(__dirname, "index.html"));
});
// starts the server.
server.listen(process.env.PORT || 5000, function () {
    console.log("Starting server on port 5000");
});

const NUM_ROUNDS = 4;
const NUM_CARDS = 5;
const GOOGLE_LANG = set_lang("google-1000.txt");
const ENGLISH_LANG = set_lang("english-10000.txt");
var players = {};
var in_game = false;
var game_type = "";
var num_players = 0;
var round_num = 0;
var num_chosen = 0;
var value = 0;

function set_lang(file) {
    // grab random lines from file and put in dictionary
    return fs
        .readFileSync(path.resolve("./") + "/input/" + file, "utf-8")
        .split("\n");
}

function get_lang() {
    if (game_type == "english") {
        return ENGLISH_LANG;
    } else if (game_type == "google") {
        return GOOGLE_LANG;
    }
}

io.on("connection", function (socket) {
    socket.on("new_player", function (new_player) {
        // Make sure two players don't use the same name
        let exists = false;
        for (let key in players) {
            if (players[key]["name"] === new_player) {
                exists = true;
            }
        }
        if (in_game) {
            socket.emit("received_new_player", false, false);
        } else if (exists) {
            socket.emit("received_new_player", false, true);
        } else {
            num_players += 1;
            players[socket.id] = { score: 0, name: new_player };
            socket.emit("received_new_player", true, false);
            player_names = [];
            for (let key in players) {
                player_names.push(players[key]["name"]);
            }
            io.sockets.emit("current_players", player_names);
        }
    });

    socket.on("start_game", function (type) {
        if (!validate_player(socket.id)) {
            socket.emit("err", "not a current player in the game");
            return;
        }
        in_game = true;
        // send everyone the players
        let scores = [];
        for (let key in players) {
            scores.push([players[key]["name"], players[key]["score"]]);
        }
        for (let key in players) {
            io.to(key).emit("results", -1, scores, [], undefined);
        }
        game_type = type;
        begin_game();
    });

    socket.on("card_chosen", function (card_chosen) {
        if (!validate_player(socket.id)) {
            socket.emit("err", "not a current player in the game");
            return;
        }
        // check to make sure they actually have that card, and that they haven't already submitted a card
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
        players[socket.id]["card_chosen"] =
            players[socket.id]["cards"][card_ind];
        players[socket.id]["cards"].splice(card_ind, 1);
        if (num_chosen == num_players) {
            end_round();
        }
    });

    socket.on("continue", function () {
        if (!validate_player(socket.id)) {
            socket.emit("err", "not a current player in the game");
            return;
        }

        if (round_num < NUM_ROUNDS) {
            begin_round();
        } else {
            end_game();
        }
    });

    socket.on("terminate", function () {
        in_game = false;
        num_players = 0;
        round_num = 0;
        players = {};
        num_chosen = 0;
        io.sockets.emit("game_ended");
    });
});

function validate_player(socket_id) {
    return socket_id in players;
}

function begin_game() {
    // grab random lines from file and put in dictionary
    for (let key in players) {
        cards = [];
        for (let i = 0; i < NUM_CARDS; ++i) {
            let rand_num = Math.floor(Math.random() * get_lang().length);
            cards.push([get_lang()[rand_num], rand_num]);
        }
        players[key]["cards"] = cards;

        io.to(key).emit(
            "player_cards",
            players[key]["cards"].map((c) => c[0])
        );
    }
    begin_round();
}

function begin_round() {
    // deal out one card
    value = Math.ceil(Math.random() * 10);
    for (let key in players) {
        io.to(key).emit("new_val", round_num + 1, value);
    }
}

function end_round() {
    let chosen = calculate_scores();
    let scores = [];
    for (let key in players) {
        scores.push([players[key]["name"], players[key]["score"]]);
    }
    for (let key in players) {
        let rand_num = Math.floor(Math.random() * get_lang().length);
        new_card = [get_lang()[rand_num], rand_num];
        players[key]["cards"].push(new_card);
        io.to(key).emit("results", round_num + 1, scores, chosen, new_card[0]);
    }
    round_num += 1;
    num_chosen = 0;
}

// returns list of cards chosen
function calculate_scores() {
    // check dictionary for who had the highest score
    // add appropriate value to top player
    let chosen = [];
    let min_player = "";
    let min_number = Infinity;
    for (let key in players) {
        let card_chosen = players[key]["card_chosen"];
        // A lower index is a more popular card, therefore a winner
        if (card_chosen[1] < min_number) {
            min_number = card_chosen[1];
            min_player = key;
        }
        chosen.push([players[key]["name"], card_chosen[0], card_chosen[1]]);
    }
    players[min_player]["score"] += value;
    chosen.sort(function (a, b) {
        a_val = a[2];
        b_val = b[2];
        return a_val < b_val ? -1 : a_val > b_val ? 1 : 0;
    });
    return chosen;
}

function end_game() {
    // reset all values accordingly
    let winner = "";
    let max_score = 0;
    for (let key in players) {
        if (players[key]["score"] > max_score) {
            winner = players[key]["name"];
            max_score = players[key]["score"];
        }
    }
    io.sockets.emit("end_game", winner);
}
