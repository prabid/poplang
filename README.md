## Running the App

```
cd poplang/
node server.js
```

## Gameplay

Pop(ular)lang(uage) is a card game for two to Ꝏ people. There are four rounds, and the player with the most points at the end is the winner.

Each player starts with five cards and uses one card each round, which is then randomly replaced with another from the deck. The content of the card depends on the category chosen for that particular game. There are two categories to choose from: English words, and Google search queries. The value of the card then depends on how popular that word or phrase has been. For example, the value of the card "what time is it" would be extremely high because it is a very commonly asked question on Google. The value of the card "how to make macarons?" would be lower. Similarly, "the" would have a high value, and "swaziland" would have a low value.

The number of points to be gained each round is randomly determined between 1-10 and shown at the start of the round. Each player must then select a card, and the player with the most popular card wins those points. The results are then displayed, along with the numeric popularity of each card. Confusingly, a smaller number is better: 1 being the most common, 2 being the second most common, et cetera.

The game is available online at https://poplang-prabid.herokuapp.com/, please enjoy!


