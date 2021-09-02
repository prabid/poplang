const NUM_CARDS = 5;
var socket = io();
var socket_id = "";
var player_name = "";

window.onload = function () {
    set_join_game_page();
};

function on_enter(e, func) {
    const ENTER_KEY = 13;
    // look for window.event in case event isn't passed in
    e = e || window.event;
    if (e.keyCode == ENTER_KEY) {
        func();
        return false;
    }
    return true;
}

function set_join_game_page() {
    $(".nameForm").show();
    $("#name").focus();
}
function set_undo_join_game_page() {
    $(".nameForm").hide();
}

function set_waiting_room_accepted_page() {
    $("#begin").show();
    $(".startBtn").focus();
}
function set_waiting_room_name_already_taken_page() {
    $("#nameAlreadyTaken").show();
}
function set_waiting_room_unaccepted_page() {
    $("#alreadyInProgress").show();
    $("#end").show();
}
function set_undo_waiting_room_page() {
    $("#begin").hide();

    $("#nameAlreadyTaken").hide();

    $("#alreadyInProgress").hide();
    $("#end").hide();
}

function set_scores_page() {
    $("#end").show();
    $(".scoreboardHeader").show();
}
function set_undo_scores_page() {
    $("#end").hide();
    $(".scoreboardHeader").hide();
}

function set_choosing_page() {
    $("#info").show();

    // Allows players to select a card using the left and right arrow keys
    $("body").keydown(function (e) {
        const LEFT_KEY = 37;
        const RIGHT_KEY = 39;

        if (e.keyCode !== LEFT_KEY && e.keyCode !== RIGHT_KEY) {
            return;
        }

        // If no card is currenly selected, focus on the first one
        if ($(":focus[id*='card-']").length === 0) {
            $("#card-0").focus();
            return;
        }

        let focus_num = Number($(":focus").attr("id").replace("card-", ""));
        if (e.keyCode == LEFT_KEY) {
            $(
                "#card-" + ((focus_num + NUM_CARDS - 1) % NUM_CARDS).toString()
            ).focus();
        } else if (e.keyCode == RIGHT_KEY) {
            $("#card-" + ((focus_num + 1) % NUM_CARDS).toString()).focus();
        }
    });
}
function set_undo_choosing_page() {
    $("#info").hide();
    $("body").off("keydown");
}

function set_results_page() {
    $("#results").show();
    $("#continue").focus();
}
function set_undo_results_page() {
    $("#results").hide();
    $(".chosen").empty();
}

socket.on("received_new_player", (accepted, already_taken) => {
    socket_id = socket.id;
    if (accepted) {
        set_waiting_room_accepted_page();
    } else if (already_taken) {
        set_waiting_room_name_already_taken_page();
    } else {
        set_waiting_room_unaccepted_page();
    }
});

socket.on("current_players", (player_names) => {
    $("#waitingRoomPlayers").empty();

    player_names.forEach((p) => {
        let name = document.createElement("div");
        name.classList.add("waitingListPlayer");
        name.append(
            document
                .createElement("span")
                .appendChild(document.createTextNode(p))
        );

        $("#waitingRoomPlayers").append(name);
    });
});

function submit_name() {
    player_name = $("#name").val();
    if (player_name != "") {
        socket.emit("new_player", player_name);
        set_undo_join_game_page();
    }
}

function start_game() {
    socket.emit("start_game", $("#gameType :selected").val());
}

function card_chosen(event) {
    if ($(".card[disabled]").length > 0) {
        return;
    }
    socket.emit("card_chosen", event.target.value);
    $(event.target).prop("disabled", true);
}

// get value for round
socket.on("new_val", function (round_num, value) {
    $("#roundNum").text("Round " + round_num.toString());
    set_undo_results_page();
    set_choosing_page();
    $("#value").text(value.toString());
});

// on "results", show current scores
socket.on("results", function (round_num, results, chosen, new_card) {
    $("#scores > tbody").empty();
    if (round_num !== -1) {
        set_results_page();
        set_undo_choosing_page();

        let button = $(".card[disabled]");
        button.empty();
        button.val(new_card);
        button.text(new_card);
        button.prop("disabled", false);
        $("#roundNum").text("Round " + round_num.toString() + " Results");
    }
    results.forEach((r) => {
        let score = document.createElement("tr");
        let score_player = $(document.createElement("td")).text(r[0]);
        let score_points = $(document.createElement("td")).text(r[1]);
        if (r[0] === player_name) {
            $(score_player).css("font-weight", "Bold");
        }
        $(score).append(score_player);
        $(score).append(score_points);
        $("#scores > tbody").append(score);
    });

    let winner = $(".winnerName");
    winner.empty();
    if (chosen.length > 0) {
        winner.append(document.createTextNode(chosen[0][0]));
    }

    chosen.forEach((c) => {
        let chose = document.createElement("div");
        chose.classList.add("chosenItem");

        let chose_name = document.createElement("div");
        chose_name.append(
            document
                .createElement("p")
                .appendChild(document.createTextNode(c[0]))
        );
        chose_name.classList.add("chosenName");

        let chose_word = document.createElement("div");
        chose_word.append(
            document
                .createElement("p")
                .appendChild(document.createTextNode(c[1]))
        );
        chose_word.classList.add("chosenWord");

        let chose_val = document.createElement("div");
        chose_val.append(
            document
                .createElement("p")
                .appendChild(document.createTextNode(c[2]))
        );
        chose_val.classList.add("chosenPop");

        if (c[0] === player_name) {
            $(chose_name).css("font-weight", "Bold");
        }
        $(chose).append(chose_name);
        $(chose).append(chose_word);
        $(chose).append(chose_val);

        $(".chosen").append(chose);
    });

    // prevents lag on first round
    if (round_num !== -1) {
        $(".scoreboardHeader").show();
    }
});

socket.on("game_ended", () => {
    set_undo_waiting_room_page();
    set_undo_scores_page();
    set_undo_results_page();
    set_undo_choosing_page();

    set_join_game_page();
});

function cont() {
    socket.emit("continue");
}

function terminate() {
    socket.emit("terminate");
}

// finish
socket.on("end_game", function (winner) {
    $("#roundNum").text(winner + " won the game!");
    set_undo_results_page();
});

// on receiving initial cards
socket.on("player_cards", function (cards) {
    $("#cards").empty();
    for (let i = 0; i < NUM_CARDS; ++i) {
        let button = document.createElement("button");
        button.id = "card-" + i.toString();
        button.classList.add("card");
        button.value = cards[i];
        button.appendChild(document.createTextNode(cards[i]));
        button.onclick = function () {
            card_chosen(event);
        };
        $("#cards").append(button);
    }

    set_undo_waiting_room_page();
    set_scores_page();
});
