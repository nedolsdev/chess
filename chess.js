// The basic game of chess
// I want to add AI later don't forget about your minimax script
// Later I should invert the pieces list so that pawns are at the top as obvious good moves are often a pawn taking material
var count = 0;
class ChessGame {
      constructor(fenString) {
            this.pieces = {
                  black : {
                        pawns : [],
                        kings : [],
                        rooks : [],
                        bishops : [],
                        queens : [],
                        knights : [],
                  },
                  white : {
                        pawns : [],
                        kings : [],
                        rooks : [],
                        bishops : [],
                        queens : [],
                        knights : [],
                  }
            };
            this.moves = {
                moves : [],
                captures : []
            };
            this.selectedPiece = undefined;
            this.enpassantTargetSquare = undefined;
            this.potentialEnpassant = undefined;
            this.potentialCaptures = [];
            this.squaresInCheck = [];
            this.kingAttackers = [];
            this.castlingRights = {
                  black : {
                        queenSide : true,
                        kingSide : true,
                  },
                  white : {
                        queenSide : true,
                        kingSide : true,
                  },
            };
            this.tempCastlingRights = {
                  black : {
                        queenSide : false,
                        kingSide : false,
                  },
                  white : {
                        queenSide : false,
                        kingSide : false,
                  },
            }
            if (fenString == false) {
                  return;
            }

            if (fenString == undefined) {
                  this.loadGameFromFenString("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
            } else {
                  this.loadGameFromFenString(fenString);
            }

      }

      updateGameState(position, piece, originalPosition, changeTurn, isFinal) {
              //order of these functions matter particulary which are before and after change turn and after getting king attackers
              this.updatePromotion(piece, position);
              this.moveRookForCastle(position, piece, originalPosition);
              if (changeTurn) {
                    this.turn = this.changeTurn();
              }
              this.updateEnpassant(position, piece, originalPosition);
              this.getSquaresInCheckSurroundingKing();
              this.kingAttackers = this.getKingAttackers(); //gets array of pieces attacking the king
              this.getAttackerInterceptingSquares(); //gets all intercepting squares from attackers
              this.updatePins(); //updates pieces which are pinned and not pinned
              this.updatePermCastling();
              this.updateTempCastling();

              this.moves = this.findAllChildrenMoves(this);


              // if (this.moves.moves.length == 0 && this.moves.captures.length == 0) {
              //       if (this.kingInCheck) {
              //             var turn = this.changeTurn();
              //             alert(turn + " wins!");
              //             return;
              //       }
              //       alert("Stalemate");
              //       return;
              // }
              //
              // if (this.knownStalemate()) {
              //       alert("Known Stalemate");
              //       return;
              // }
              //
              // var chessGame = this;
              //
              // var childrenPositions = getChildrenPositions(chessGame);
              // console.log("children positions...")
              // console.log(childrenPositions)
              //
              //
              // var move = randomMoveAI.makeMoveFromMoveSet(chessGame.moves);
              // count++;
              // console.log("Positions: " + count);
              // chessGame.makeMoveFromMoveObject(move, chessGame);

      }

      getChildPositionFromMove(move, chessGame) {
            //get deep copy of object
            var newGame = deepCopy(chessGame);
            newGame.makeMoveFromMoveObject(move, newGame);
            newGame.move = move;
            return newGame;
      }

      testForAttackers(attackers, type1, type2) {
            var allAttackers = [];
            for (var i=0; i < attackers.captures.length; i++) {
                  if (attackers.captures[i].captureTarget.piece.type == type1 || attackers.captures[i].captureTarget.piece.type == type2) {
                          allAttackers.push(attackers.captures[i].captureTarget.piece);
                  }
            }
            return allAttackers;
      }

      getAttackerInterceptingSquares() {
            var king = this.pieces[this.turn]["kings"][0];
            for (var i=0; i < this.kingAttackers.length; i++) { //get intercepting positions for each piece
                    var attacker = this.kingAttackers[i];
                    attacker.interceptingPositions = attacker.getInterceptingSquares(this, king);
            }
      }

      getKingAttackers() {
              var attackers = [];
              var king = this.pieces[this.turn]["kings"][0];
              attackers = attackers.concat(this.testForAttackers(king.getKnightMoves(this, []), "knight"));
              attackers = attackers.concat(this.testForAttackers(king.getSlidingMoves(this, [], "rook"), "rook", "queen"));
              attackers = attackers.concat(this.testForAttackers(king.getSlidingMoves(this, [], "bishop"), "bishop", "queen"));
              attackers = attackers.concat(this.testForAttackers(king.getPawnMoves(this, []), "pawn"));
              attackers = attackers.concat(this.testForAttackers(king.getKingMoves(this, []), "king"));
              return attackers;
      }

      updatePinFromPieceResult(direction, pieceResult, result, noEnpassant) {
            if (direction.type == pieceResult.endPoint.piece.type || pieceResult.endPoint.piece.type == "queen") { //is pinned
                    var pinnedPiece = result.endPoint.piece;
                    var attacker = pieceResult.endPoint.piece;
                    var movePosition = {...pinnedPiece.position}
                    if (noEnpassant === true) {
                          this.enpassantTargetSquare = undefined;
                          return;
                    }
                    pinnedPiece.pinned = true;
                    pinnedPiece.pinnedSquares = [];
                    while (movePosition.row != attacker.position.row || movePosition.column != attacker.position.column) {
                          movePosition = pinnedPiece.newPositionFromDirection(movePosition, direction);
                          pinnedPiece.pinnedSquares.push(movePosition.square);
                    }
            }
      }

      makeMoveFromMoveObject(move, gameState) {
            executeMove(move.square, move.piece, gameState, undefined, true);
      }

      updatePins() {
            for (var pieces in this.pieces[this.turn]) {
                    for (var i=0; i < this.pieces[this.turn][pieces].length; i++) {
                          this.pieces[this.turn][pieces][i].pinned = false;
                    }
            }
            var king = this.pieces[this.turn]["kings"][0];
            var directions = king.getSlidingDirections("queen");
            for (var i=0; i < directions.length; i++) {
                    var result = king.getMovesInDirection({moves : [], captures : []}, king.position, directions[i], this, [], true);
                    if (result.endPoint != undefined && result.endPoint.piece.color == this.turn) { //found potentially pinned friendly piece
                            var pieceResult = king.getMovesInDirection({moves : [], captures : []}, result.endPoint.piece.position, directions[i], this, [], true);
                            if (pieceResult.endPoint != undefined && pieceResult.endPoint.piece.color != this.turn && pieceResult.endPoint.piece.position.square != this.enpassantTargetPawn?.square) {
                                  this.updatePinFromPieceResult(directions[i], pieceResult, result);
                            }
                            if (pieceResult.endPoint != undefined && this.enpassantTargetPawn != undefined && pieceResult.endPoint.piece.position.square == this.enpassantTargetPawn.square) {
                                  var pieceResult = king.getMovesInDirection({moves : [], captures : []}, pieceResult.endPoint.piece.position, directions[i], this, [], true);
                                  if (pieceResult.endPoint != undefined && pieceResult.endPoint.piece.color != this.turn) {
                                        this.updatePinFromPieceResult(directions[i], pieceResult, result, true);
                                  }
                            }
                    }
            }
      }

      getSquaresInCheckSurroundingKing() {
            this.squaresInCheck = [];
            var king = this.pieces[this.turn]["kings"][0];
            var originalKingPosition = {...king.position};
            this.board[originalKingPosition.row][originalKingPosition.column] = new Square();
            var directions = king.getKingDirections();
            for (var i=0; i < directions.length; i++) {
                    var newPosition = king.newPositionFromDirection(originalKingPosition, directions[i]);
                    if (king.positionIsOutOfBounds(newPosition) || king.squareAtPosition(this.board, newPosition).piece?.color == this.turn) { //if the square is our own piece we can't move there
                            continue;
                    }
                    king.position = newPosition;
                    this.kingAttackers = this.getKingAttackers();
                    if (this.kingAttackers.length != 0) { //there are some attackers hence there is check
                            this.squaresInCheck.push(newPosition.square);
                    }
            }
            this.board[originalKingPosition.row][originalKingPosition.column] = new Square(king);
            king.position = originalKingPosition;
      }

      getInitalRookSquares() { //queen side, king side
            if (this.turn == "black") {
                  return [0, 7];
            }
            if (this.turn == "white") {
                  return [56, 63];
            }
      }

      updatePermCastling() { //castling rights for the game
              var king = this.pieces[this.turn]["kings"][0];
              var rooks = this.getInitalRookSquares();
              if ((king.color == "black" && king.position.square != 4) || (king.color == "white" && king.position.square != 60)) {
                      this.castlingRights[this.turn].kingSide = false;
                      this.castlingRights[this.turn].queenSide = false;
              }
              if (this.castlingRights[this.turn].kingSide && king.squareAtPosition(this.board, this.getRowColPositionFromSquare(rooks[1])).piece?.type != "rook") {
                        this.castlingRights[this.turn].kingSide = false;
              }
              if (this.castlingRights[this.turn].queenSide && king.squareAtPosition(this.board, this.getRowColPositionFromSquare(rooks[0])).piece?.type != "rook") {
                        this.castlingRights[this.turn].queenSide = false;
              }
      }

      getQueenSideSquares() {
            if (this.turn == "white") {
                  return [59, 58, 57, 56];
            }
            if (this.turn == "black") {
                  return [3, 2, 1, 0];
            }
      }

      getKingSideSquares() {
            if (this.turn == "white") {
                  return [61, 62, 63];
            }
            if (this.turn == "black") {
                  return [5, 6, 7];
            }
      }

      canCastle(squares) {
              var king = this.pieces[this.turn]["kings"][0];
              for (var i=0; i < squares.length-1; i++) {
                      if (king.squareAtPosition(this.board, this.getRowColPositionFromSquare(squares[i])).piece != undefined) { //can only castle through empty squares
                              return false;
                      }
              }
              var originalKingPosition = {...king.position};
              for (var i=0; i < squares.length-1; i++) { //test if the squares are in check
                    king.position = this.getRowColPositionFromSquare(squares[i]);
                    var attackers = this.getKingAttackers();
                    if (attackers.length != 0) { //there are some attackers hence there is check
                            king.position = originalKingPosition;
                            return false;
                    }
              }
              king.position = originalKingPosition;
              return true;
      }

      updateTempCastling() { //castling rights for the turn
              this.tempCastlingRights = {
                    black : {},
                    white : {},
              };
              this.tempCastlingRights[this.turn].kingSide = this.castlingRights[this.turn].kingSide;
              this.tempCastlingRights[this.turn].queenSide = this.castlingRights[this.turn].queenSide;

              if (this.castlingRights[this.turn].kingSide && !this.canCastle(this.getKingSideSquares())) {
                      this.tempCastlingRights[this.turn].kingSide = false;
              }
              if (this.castlingRights[this.turn].queenSide && !this.canCastle(this.getQueenSideSquares())) {
                      this.tempCastlingRights[this.turn].queenSide = false;
              }
      }

      updateEnpassant(position, piece, originalPosition) {
            if (piece == undefined) {
                  return;
            }
            if (piece.type == "pawn" && this.enpassantTargetSquare != undefined && piece.position.square == this.enpassantTargetSquare.square) {
                  var pawnPos = this.getRowColPositionFromSquare(this.enpassantTargetSquare.square + piece.getPawnDirection()*-8);
                  this.board[pawnPos.row][pawnPos.column] = new Square();
                  //AI do not render
                  if (!ai) {
                        hideSquareImage(pawnPos.square);
                  }
            }
            if (piece.type == "pawn" && Math.abs(originalPosition.row - position.row) == 2) {
                  this.enpassantTargetSquare = position;
                  this.enpassantTargetSquare.row = originalPosition.row + (position.row - originalPosition.row)/2;
                  this.enpassantTargetSquare.square = this.enpassantTargetSquare.row * 8 + this.enpassantTargetSquare.column;
                  this.enpassantTargetPawn = this.getRowColPositionFromSquare(this.enpassantTargetSquare.square + piece.getPawnDirection()*8);
            } else {
                  this.enpassantTargetSquare = undefined;
                  this.enpassantTargetPawn = undefined;
            }
      }

      updatePromotion(piece, position) {
              if (piece == undefined || piece.type != "pawn") {
                    return;
              }
              var row;
              if (this.turn == "white") {
                    row = 0;
              }
              if (this.turn == "black") {
                    row = 7;
              }
              if (position.row == row) {
                    piece.promoteToType(promotePawn());
                    if (!ai) {
                          renderPiece(position.square, piece);
                    }
              }
      }

      moveRookForCastle(position, piece, originalPosition) {
              if (piece == undefined || piece.type != "king") {
                    return;
              }
              if (originalPosition.column - position.column == 2) { //castled to queen side
                    this.castlingRights[this.turn].queenSide = false;
                    this.castlingRights[this.turn].kingSide = false;
                    executeMove(piece.newPositionFromDirection(position, {row : 0, column : 1}).square, piece.squareAtPosition(this.board, {row : position.row, column : 0}).piece, this, true)

              }
              if (position.column - originalPosition.column == 2) { //castled to king side
                    this.castlingRights[this.turn].queenSide = false;
                    this.castlingRights[this.turn].kingSide = false;
                    executeMove(piece.newPositionFromDirection(position, {row : 0, column : -1}).square, piece.squareAtPosition(this.board, {row : position.row, column : 7}).piece, this, true)
              }
      }

      knownStalemate() {
            for (var pieces in this.pieces.white) { //king stalemate
                  if (pieces != "kings" && (this.pieces.white[pieces].length != 0 || this.pieces.black[pieces].length != 0)) {
                          return false;
                  }
            }
            return true;
      }

      removePieceFromPieces(piece) {
              var turn = this.changeTurn();
              var pieces = this.pieces[turn][piece.originalType + "s"];
              for (var i=0; i < pieces.length; i++) {
                    if (piece.position.square == pieces[i].position.square) {
                            pieces.splice(i, 1);
                            return;
                    }
              }
              console.log("error could not find piece");
      }

      updateFromMove(newSquare, piece, isCastle, isFinal) {
              if (piece == undefined) {
                    return;
              }
              var originalPosition = {...piece.position}
              var position = this.getRowColPositionFromSquare(newSquare);
              var square = this.board[position.row][position.column];
              if (!square.isEmpty && !isCastle) {
                    this.removePieceFromPieces(square.piece);
              }
              square.piece = piece;
              square.isEmpty = false;
              this.board[piece.position.row][piece.position.column] = new Square();
              piece.position = piece.getRowColPositionFromSquare(newSquare);
              if (isCastle !== true) {
                    this.updateGameState(position, piece, originalPosition, true, isFinal);
              }

      }

      findAllChildrenMoves(chessGame) {
            var piecesToInvestigate = this.findPiecesToCreateGameStates(chessGame);
            var childrenGameStates = {
                  captures : [],
                  moves : []
            };
            for (var pieces of piecesToInvestigate) {
                    var legalMoves = pieces.getAllLegalMoves(chessGame);
                    childrenGameStates.captures = childrenGameStates.captures.concat(legalMoves.captures);
                    childrenGameStates.moves = childrenGameStates.moves.concat(legalMoves.moves);
            }
            return childrenGameStates;
      }

      clearAllMoves(allPieces) {
            for (var pieces in allPieces) {
                    for (var i=0; i < allPieces[pieces].length; i++) {
                          allPieces[pieces][i].legalMoves = {moves: [], captures : []};
                    }
            }
      }

      findPiecesToCreateGameStates(chessGame) { //locates all pieces which may eventuate to new game states
              var pieces = [];
              chessGame.clearAllMoves(chessGame.pieces[chessGame.turn]);
              if (chessGame.kingAttackers.length >= 2) { //double check or greater only king can move
                    chessGame.kingInDoubleCheck = true;
                    chessGame.kingInCheck = true;
                    //add games states from king only
              } else {
                    chessGame.kingInDoubleCheck = false;
                    if (chessGame.kingAttackers.length >= 1) {
                          chessGame.kingInCheck = true;
                    } else {
                          chessGame.kingInCheck = false;
                    }
                    //add game states from all pieces
                    pieces = pieces.concat(chessGame.pieces[chessGame.turn].pawns);
                    pieces = pieces.concat(chessGame.pieces[chessGame.turn].knights);
                    pieces = pieces.concat(chessGame.pieces[chessGame.turn].bishops);
                    pieces = pieces.concat(chessGame.pieces[chessGame.turn].rooks);
                    pieces = pieces.concat(chessGame.pieces[chessGame.turn].queens);
              }
              pieces = pieces.concat(chessGame.pieces[chessGame.turn].kings);
              return pieces;
      }

      pieceCanBeCaptured(square) {
            for (var i=0; i < this.potentialCaptures.length; i++) {
                  if (square == this.potentialCaptures[i].square) {
                        return true;
                  }
            }
            return false;
      }

      pieceCanMove(square) {
            if (this.potentialMoves == undefined) {
                  return false;
            }
            for (var i=0; i < this.potentialMoves.length; i++) {
                  if (square == this.potentialMoves[i].square) {
                        return true;
                  }
            }
            return false;
      }

      clearMoves() {
            this.selectedPiece = undefined;
            this.potentialCaptures = [];
            this.potentialMoves = [];
      }

      changeTurn() {
            if (this.turn == "white") {
                  return "black";
            } else {
                  return "white";
            }
      }

      loadGameFromFenString(fenString) { //resets this chess game object from a FEN string
            this.board = [];
            var rows = fenString.split('/');
            var square = 0; //keeps track of square on the board
            rows[8] = rows[7].split(' '); //final row has additional data
            rows[7] = rows[8][0]; //reseting final row
            for (var i=0; i <= 7; i++) { //loops through actual rows
                  var boardRow = [];
                  for (var j=0; j < rows[i].length; j++) { //loops through characters in row
                          if (rows[i][j] >= 1 && rows[i][j] <= 8) { //is an empty square
                                  for (var k=0; k < rows[i][j]; k++) {
                                        boardRow.push(new Square());
                                        square++;
                                  }
                          } else { //is a piece
                                  var piece = this.pieceFromFenCharacter(rows[i][j], square);
                                  this.pieces[piece.color][piece.originalType+"s"].push(piece);
                                  boardRow.push(new Square(piece));
                                  square++;
                          }
                  }
                  this.board.push(boardRow);
            }
            if (rows[8][1] == "w")  {
                  this.turn = "white";
            } else {
                  this.turn = "black";
            }
            if (rows[8][2].includes("K")) this.castlingRights.white.kingSide = true;
            if (rows[8][2].includes("Q")) this.castlingRights.white.queenSide = true;
            if (rows[8][2].includes("k")) this.castlingRights.black.kingSide = true;
            if (rows[8][2].includes("q")) this.castlingRights.black.queenSide = true;

            this.enpassantTargetSquare = this.chessSquareNotationToPosition(rows[8][3]);
            this.fullMoves = parseInt(rows[8][4]);
            this.halfMoves = parseInt(rows[8][5]);
      }

      chessSquareNotationToPosition(notation) { //notation deontes a square not a move
              if (notation.length != 2) { //invalid notation ie. - denoting a lack of a square
                    return undefined;
              }
              var file = notation[0];
              var row = notation[1];
              if (file < "a" || file > "h") { //invalid file
                    return undefined;
              }
              if (row < 1 || row > 8) { //invalid row
                    return undefined;
              }
              row--; //rows are from 0-7
              var column = notation.charCodeAt(0)-97; //converts a to 0, b to 1 etc.
              var square = row * 8 + column;
              return {
                    square : square,
                    row : row,
                    column : column
              };
      }

      pieceFromFenCharacter(char, square) {
            var color = "white";
            if (char >= "a" && char <= "z") color = "black"; //lower case denotes black, upper case denotes white
            var type;
            if (char == "P" || char == "p") type = "pawn";
            if (char == "N" || char == "n") type = "knight";
            if (char == "B" || char == "b") type = "bishop";
            if (char == "R" || char == "r") type = "rook";
            if (char == "Q" || char == "q") type = "queen";
            if (char == "K" || char == "k") type = "king";
            return new Piece(color, type, square);
      }

      displayBoard() {
            var square = 0;
            for (var i=0; i < this.board.length; i++) {
                  for (var j=0; j < this.board[i].length; j++) {
                          if (this.board[i][j].isEmpty) {
                                hideSquareImage(square)
                          } else {
                                renderPiece(square, this.board[i][j].piece);
                          }
                          square++;
                  }
            }
      }

      squareFromPosition(position) {
            return position.row * 8 + position.column;
      }

      getRowColPositionFromSquare(square) {
            return {
                  square : square,
                  column : (square) % 8, //indexed at 0
                  row : (square - ((square) % 8)) / 8, //indexed at 0
            };
      }

      getFreshBoard() {
            var board = [];
            for (var i=0; i < 8; i++) {
                  var row = [];
                  for (var j=0; j < 8; j++) {
                          row.push(new Square());
                  }
                  board.push(row);
            }
            return board;
      }
}
