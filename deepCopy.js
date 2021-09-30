function deepCopy(parentGame) {
        var childGame = new ChessGame(false); //false - do not create game with fenString
        childGame.board = childGame.getFreshBoard();
        childGame.turn = parentGame.turn;
        var colors = ["black", "white"];
        for (var i=0; i < 2; i++) {
              childGame.castlingRights[colors[i]] = {...parentGame.castlingRights[colors[i]]};
              childGame.tempCastlingRights[colors[i]] = {...parentGame.tempCastlingRights[colors[i]]};
        }
        // var foundKingAttackers = (parentGame.kingAttackers.length == 0);
        for (var row=0; row < 8; row++) {
              for (var column=0; column < 8; column++) {
                      if (!parentGame.board[row][column].isEmpty) { //some piece
                              var piece = parentGame.board[row][column].piece;
                              var pieceCopy = new Piece(piece.color, piece.type, {row : piece.position.row, column : piece.position.column, square : piece.position.square,});
                              // if (!foundKingAttackers) {
                              //       for (var i=0; i < parentGame.kingAttackers.length; i++) {
                              //             if (piece == parentGame.kingAttackers[i]) {
                              //                     childGame.kingAttackers.push(pieceCopy);
                              //             }
                              //             if (childGame.kingAttackers.length == parentGame.kingAttackers.length) {
                              //                     foundKingAttackers = true;
                              //             }
                              //       }
                              // }
                              childGame.pieces[piece.color][piece.type+"s"].push(pieceCopy);
                              childGame.board[row][column].piece = pieceCopy;
                              childGame.board[row][column].isEmpty = false;
                              // pieceCopy.pinned = piece.pinned;
                              // pieceCopy.pinnedSquares = [].concat(piece.pinnedSquares);
                      }
               }
        }
        // childGame.kingInCheck = parentGame.kingInCheck;
        // childGame.kingInDoubleCheck = parentGame.kingInDoubleCheck;
        // childGame.enpassantTargetPawn = {...parentGame.enpassantTargetPawn};
        // childGame.enpassantTargetSquare = {...parentGame.enpassantTargetSquare};
        // childGame.squaresInCheck = [].concat(parentGame.squaresInCheck);
        return childGame;
}
