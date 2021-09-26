var randomMoveAI = {
      makeMoveFromMoveSet : function(moves) {
              var movesAndCaptures = moves.moves.concat(moves.captures);
              console.log(movesAndCaptures);
              var index = Math.floor(Math.random()*movesAndCaptures.length);
              console.log(index)
              return movesAndCaptures[index];
      }
}
