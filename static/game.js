const NUM_CARDS = 5;
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
        alert("Sorry, the game is in progress or username is incorrect");
        $("#end").show();
    }
    else {
        $("#begin").show();
        $("#begin").focus();
    }
});

function submit_name() {
    player_name = $("#name").val()
    socket.emit("new_player", player_name);
    $(".nameForm").hide();
}

function start_game() {
    socket.emit("start_game");
}

function card_chosen(event) {
    if ($(".card[disabled]").length > 0) {
        return;
    }
    socket.emit("card_chosen", event.target.value)
    $(event.target).prop("disabled", true)
}

// get value for round
socket.on("new_val", function(round_num, value) {
    $("#round_num").text("Round " + round_num.toString())
    $("#results").hide();
    $("#info").show();
    $("body").keydown(function(e) {
        if (e.keyCode !== 37 && e.keyCode !== 39) {
            return;
        }
        if ($(":focus[id*='card-']").length === 0) {
            $("#card-0").focus();
            return;
        }
        let focus_num = Number($(":focus").attr("id").replace('card-', ''));
        if (e.keyCode == 37) { // left
          $("#card-" + ((focus_num + NUM_CARDS - 1) % NUM_CARDS).toString()).focus()
        }
        else if (e.keyCode == 39) { // right
          $("#card-" + ((focus_num + 1) % NUM_CARDS).toString()).focus()
        }
      });
    $("#value").text(value.toString());
})

// on "results", show current scores
socket.on("results", function(round_num, results, chosen, new_card) {
    $("#scores > tbody").empty();
    if (round_num !== -1) {
        $(".chosen").empty();
        $("#end").show();
        $("#results").show();
        $("#info").hide();
        $("body").off("keydown");
        $("#continue").focus();

        let button = $(".card[disabled]");
        button.empty();
        button.val(new_card);
        button.append(document.createTextNode(new_card));
        button.prop("disabled", false);
    }

    $("#round_num").text("Round " + round_num.toString() + " Results");
    results.forEach(r => {
        let score = document.createElement("tr");
        let score_player = $(document.createElement("td")).text(r[0])
        let score_points = $(document.createElement("td")).text(r[1]);
        if (r[0] === player_name) {
            $(score_player).css("font-weight","Bold");
        }
        $(score).append(score_player)
        $(score).append(score_points)
        $("#scores > tbody").append(score)
    });

    let winner = $(".winner")
    winner.empty();
    if (chosen.length > 0) {
        winner.append(document.createTextNode(chosen[0][0]))
    }

    chosen.forEach(c => {
        let chose = document.createElement("div");
        chose.classList.add("chosenItem")

        let chose_name = document.createElement("div");
        chose_name.append(document.createElement("p").appendChild(document.createTextNode(c[0])));
        chose_name.classList.add("chosenName")

        let chose_word = document.createElement("div");
        chose_word.append(document.createElement("p").appendChild(document.createTextNode(c[1])));
        chose_word.classList.add("chosenWord")

        let chose_pop = document.createElement("div");
        chose_pop.append(document.createElement("p").appendChild(document.createTextNode(c[2])));
        chose_pop.classList.add("chosenPop")

        if (c[0] === player_name) {
            $(chose_name).css("font-weight","Bold");
        }
        $(chose).append(chose_name);
        $(chose).append(chose_word)
        $(chose).append(chose_pop)

        $(".chosen").append(chose)
    });

    // prevents lag on first round
    if (round_num !== -1) {
        $(".header").show();
    }
})

function cont() {
    socket.emit("continue");
}

function terminate() {
    socket.emit("terminate");
    $(".header").hide();
    $("#results").hide();
    $(".nameForm").show();
    $("#name").focus();
    $("#end").hide();
    $("#info").hide();
}

// Finish
socket.on("end_game", function(winner) {
    $("#round_num").text(winner + " won the game!");
    $("#results").hide();
})

// on receiving initial cards
socket.on("player_cards", function(cards) {
    $("#cards").empty()
    for (let i = 0; i < NUM_CARDS; ++i) {
        let button = document.createElement("button");
        button.id = "card-" + i.toString();
        button.classList.add("card");
        button.value = cards[i];
        button.appendChild(document.createTextNode(cards[i]));
        button.onclick = function() {
            card_chosen(event)
        }
        $("#cards").append(button)
    }
    $("#begin").hide();
    $(".chosen").empty();
    $("#end").show();
    $(".header").show();
});