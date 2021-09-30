//ai cannot underpromote

var randomMoveAI = {
      makeMoveFromMoveSet : function(moves) {
              var movesAndCaptures = moves.moves.concat(moves.captures);
              var index = Math.floor(Math.random()*movesAndCaptures.length);
              return movesAndCaptures[index];
      }
}

function getChildrenPositions(chessGame) {
      var moves = chessGame.moves.moves.concat(chessGame.moves.captures);
      var children = [];
      for (var i=0; i < moves.length; i++) {
              var child = chessGame.getChildPositionFromMove(moves[i], chessGame);
              children.push(child);
      }
      return children;
}

function isGameOver(chessGame) {
      if ((chessGame.moves.moves.length == 0 && chessGame.moves.captures.length == 0) || chessGame.knownStalemate()) {
            return true;
      }
      return false;
}

function evaluateBoard(chessGame, depth) {
        var score = 0;
        score -= depth * 10;
        var colors = [{color : "black", score : 0}, {color : "white", score : 0}]
        for (var i=0; i < 2; i++) {
                colors[i].score += chessGame.pieces[colors[i].color].pawns.length * 100;
                colors[i].score += chessGame.pieces[colors[i].color].knights.length * 300;
                colors[i].score += chessGame.pieces[colors[i].color].bishops.length * 300;
                colors[i].score += chessGame.pieces[colors[i].color].rooks.length * 500;
                colors[i].score += chessGame.pieces[colors[i].color].queens.length * 900;
        }
        score += colors[1].score - colors[0].score;
        return score;
}
