// Controls render and other helper functions for display and inputs etc.

//TRIGGERED ON START UP
// var ai = true;
// var autoQueen = true;
// var testGame = new ChessGame("1k6/8/8/8/8/8/1KP5/8 w KQkq - 0 1");
// renderCheckerBoard("board", testGame);
// testGame.displayBoard();
// testGame.updateGameState(undefined, undefined, undefined, false);
// var minimaxChessAI = new MiniMax(getChildrenPositions, evaluateBoard, isGameOver);
// var result = minimaxChessAI.start(testGame, 6, true);
// console.log(result);

function renderCheckerBoard(boardID, chessGame) { //add to chess class later
      var board = document.getElementById(boardID);
      var index =0;
      for (var i=0; i < 8; i++) {
            var row = document.createElement("tr");
            for (var j=0; j < 8; j++) {
                    var square = document.createElement("td");
                    square.classList.add("square");
                    if ((i + j) % 2 == 0) {
                          square.classList.add("light");
                    } else {
                          square.classList.add("dark");
                    }
                    var image = document.createElement("img");
                    image.classList.add("imageDisplay");
                    image.style.display = "none";
                    image.id = index;
                    square.id = index;
                    square.onclick = function(){
                          clickedSquare(this.id, chessGame);
                    }
                    image.onclick = function(){
                          clickedPiece(this.id, chessGame);
                    }
                    square.appendChild(image);
                    row.appendChild(square);
                    index++;
            }
            board.appendChild(row);
      }
}

function executeMove(square, piece, chessGame, isCastle, isFinal) {
        if (!ai) {
              hideSquareImage(piece.position.square);
              renderPiece(square, piece);
              clearMovesFromDisplay();
        }
        chessGame.updateFromMove(parseInt(square), piece, isCastle, isFinal);
        chessGame.clearMoves();
}

function displayMoves(piece) {
      var squares = document.getElementsByClassName("square");
      for (var i=0; i < piece.legalMoves.moves.length; i++) {
            squares[piece.legalMoves.moves[i].square].classList.add("moveHere");
      }
      for (var i=0; i < piece.legalMoves.captures.length; i++) {
            squares[piece.legalMoves.captures[i].square].classList.add("takeHere");
      }
}

function clearMovesFromDisplay() {
      var moves = document.getElementsByClassName("moveHere");
      for (var i=0; i < moves.length; i++) {
            moves[i].classList.remove("moveHere");
            i--;
      }
      var takes = document.getElementsByClassName("takeHere");
      for (var i=0; i < takes.length; i++) {
            takes[i].classList.remove("takeHere");
            i--;
      }
}

function clickedSquare(index, chessGame) {
      var position = chessGame.getRowColPositionFromSquare(index);
      var square = chessGame.board[position.row][position.column];
      if (!square.isEmpty) {
            return;
      }
      if (chessGame.pieceCanMove(index)) {
            executeMove(index, chessGame.selectedPiece, chessGame);
            return;
      }

}

function clickedPiece(index, chessGame) {
      var position = chessGame.getRowColPositionFromSquare(index);
      var piece = chessGame.board[position.row][position.column].piece;
      if (chessGame.pieceCanBeCaptured(index)) { //this piece was captured
              executeMove(index, chessGame.selectedPiece, chessGame);
              return;
      }
      if (piece.color != chessGame.turn) { //clicked on a piece that isn't ours
              chessGame.clearMoves();
              clearMovesFromDisplay();
              return;
      }
      clearMovesFromDisplay();
      chessGame.selectedPiece = piece;
      chessGame.potentialCaptures = piece.legalMoves.captures;
      chessGame.potentialMoves = piece.legalMoves.moves;
      displayMoves(piece);
}

function promotePawn() {
      if (autoQueen) {
            return "queen";
      }
      var piece = prompt("Select a piece: ");
      if (piece != "queen" && piece != "bishop" && piece != "knight" && piece != "rook") piece = "queen";
      return piece;
}

function hideSquareImage(square) { //add to square class later
        var images = document.getElementsByClassName("imageDisplay");
        images[square].style.display = "none";
        images[square].src = "";
}

function renderPiece(square, piece) { //add to square class later
      var images = document.getElementsByClassName("imageDisplay");
      images[square].style.display = "block";
      images[square].src = "./pieces/" + piece.image + ".png";
}
