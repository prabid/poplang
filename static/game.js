const NUMBER_OF_CARDS = 5;
var socket = io();
var socket_id = "";
var player_name = ""

window.onload = function() {
    $("#name").focus();
}

function on_enter(e, func) { 
    // look for window.event in case event isn't passed in
    e = e || window.event;
    if (e.keyCode == 13) {
        func();
        return false;
    }
    return true;
}

socket.on("received_new_player", (accepted) => {
    socket_id = socket.id;
    if (!accepted) {
        document.body.innerHTML = "";
        alert("Sorry, the game is in progress or username is incorrect");
    }
});

function submit_name() {
    player_name = $("#name").val()
    socket.emit("new_player", player_name);
    $("#begin").show();
    $("#begin").focus();
    $("#name_form").hide();
}

function start_game() {
    socket.emit("start_game");
}

function card_chosen(card_id) {
    if (document.getElementById("X") !== null) {
        return;
    }
    socket.emit("card_chosen", card_id)
    document.getElementById(card_id).value = "X"
    document.getElementById(card_id).id = "X"
}

// on getting a new card, add to hand
socket.on("new_card", function(round_num, new_card, value) {
    $("#round_num").text("Round " + round_num.toString())
    $("#results").hide();
    $("#info").show();
    $("#value").text(value.toString())
    let button = document.getElementById("X");
    button.value = new_card;
    button.id = new_card;
    button.onclick = function() {
        card_chosen(new_card)
    }
})

// on "results", show current scores
socket.on("results", function(round_num, results, chosen) {
    $("#scores > tbody").empty();
    $("#chosen").empty();
    $(".header").show();
    if (round_num !== -1) {
        $("#results").show();
        $("#info").hide();
        $("#continue").focus()
    }

    $("#round_num").text("Round " + round_num.toString() + " Results");
    results.forEach(r => {
        let score = document.createElement("tr");
        let score_player = $(document.createElement("td")).text(r[0])
        let score_points = $(document.createElement("td")).text(r[1]);
        // if (r[0] === player_name) {
        //     $(score_text).css("font-weight","Bold");
        // }
        $(score).append(score_player)
        $(score).append(score_points)
        $("#scores > tbody").append(score)
    });

    chosen.forEach(c => {
        let chose = document.createElement("p")
        let chose_text = $(document.createElement("span")).text(c[0] + " : " + c[1] + " (" + c[2] + ")");
        if (c[0] === player_name) {
            $(chose_text).css("font-weight","Bold");
        }
        $(chose).append(chose_text)
        if ($("#chosen").children().length === 0) {
            $(chose).append($(document.createElement("strong")).text("**Winner**"));
        }
        $("#chosen").append(chose)
    });
})

function cont() {
    socket.emit("continue");
}

// Finish
socket.on("end_game", function() { 
    $(".header").hide();
    $("#info").hide();
    $("#results").hide();
    $("#name_form").show();
    $("#name").focus();
})

// on receiving initial cards
socket.on("player_cards", function(cards) {
    $("#cards").empty()
    $("#info").show();
    $("#begin").hide()

    for (let i = 0; i < NUMBER_OF_CARDS; ++i) {
        let button = document.createElement("input");
        button.type = "button";
        button.id = cards[i];
        button.classList.add("card");
        button.value = cards[i];
        button.onclick = function() {
            card_chosen(cards[i])
        }
        $("#cards").append(button)
    }
});