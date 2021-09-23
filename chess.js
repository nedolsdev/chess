// The basic game of chess
// I want to add AI later don't forget about your minimax script
// Later I should invert the pieces list so that pawns are at the top as obvious good moves are often a pawn taking material
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
            this.moves = {};
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
            if (fenString == undefined) {
                  this.loadGameFromFenString("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq h4 0 1");
            } else {
                  this.loadGameFromFenString(fenString);
            }
            var childrenMoves = this.findAllChildrenMoves(this);
            console.log("All possible children moves states...");
            console.log(childrenMoves);
            this.moves = childrenMoves;
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
              this.kingAttackers = [];
              var king = this.pieces[this.turn]["kings"][0];
              this.kingAttackers = this.kingAttackers.concat(this.testForAttackers(king.getKnightMoves(this, []), "knight"));
              this.kingAttackers = this.kingAttackers.concat(this.testForAttackers(king.getSlidingMoves(this, [], "rook"), "rook", "queen"));
              this.kingAttackers = this.kingAttackers.concat(this.testForAttackers(king.getSlidingMoves(this, [], "bishop"), "bishop", "queen"));
              this.kingAttackers = this.kingAttackers.concat(this.testForAttackers(king.getPawnMoves(this, []), "pawn"));
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
                    var result = king.getMovesInDirection({moves : [], captures : []}, king.position, directions[i], this, []);
                    if (result.endPoint != undefined && result.endPoint.piece.color == this.turn) { //found potentially pinned friendly piece
                            var pieceResult = king.getMovesInDirection({moves : [], captures : []}, result.endPoint.piece.position, directions[i], this, []);
                            if (pieceResult.endPoint != undefined && pieceResult.endPoint.piece.color != this.turn) {
                                  if (directions[i].type == pieceResult.endPoint.piece.type || pieceResult.endPoint.piece.type == "queen") { //is pinned
                                          var pinnedPiece = result.endPoint.piece;
                                          var attacker = pieceResult.endPoint.piece;
                                          var movePosition = {...pinnedPiece.position}
                                          pinnedPiece.pinned = true;
                                          pinnedPiece.pinnedSquares = [];
                                          while (movePosition.row != attacker.position.row || movePosition.column != attacker.position.column) {
                                                movePosition = pinnedPiece.newPositionFromDirection(movePosition, directions[i]);
                                                pinnedPiece.pinnedSquares.push(movePosition.square);
                                          }
                                  }
                            }
                    }
            }
      }

      getSquaresInCheck() {
            this.squaresInCheck = [];
            var king = this.pieces[this.turn]["kings"][0];
            var originalKingPosition = {...king.position};
            var directions = king.getKingDirections();
            for (var i=0; i < directions.length; i++) {
                    var newPosition = king.newPositionFromDirection(originalKingPosition, directions[i]);
                    if (king.positionIsOutOfBounds(newPosition) || king.squareAtPosition(this.board, newPosition).piece?.color == this.turn) { //if the square is our own piece we can't move there
                            continue;
                    }
                    king.position = newPosition;
                    this.getKingAttackers();
                    if (this.kingAttackers.length != 0) { //there are some attackers hence there is check
                            this.squaresInCheck.push(newPosition.square);
                    }
            }
            king.position = originalKingPosition;
      }

      updateCastling() {

      }

      updateEnpassant(position, piece, originalPosition) {
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
            } else {
                  this.enpassantTargetSquare = undefined;
            }
      }

      updatePromotion(piece, position) {
              if (piece.type != "pawn") {
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

      updateGameState(position, piece, originalPosition) {
              //order of these functions matter particulary which are before and after change turn and after getting king attackers
              this.updatePromotion(piece, position);
              this.changeTurn();
              this.updateEnpassant(position, piece, originalPosition);
              this.getSquaresInCheck();
              this.getKingAttackers(); //gets array of pieces attacking the king
              this.getAttackerInterceptingSquares(); //gets all intercepting squares from attackers
              this.updatePins(); //updates pieces which are pinned and not pinned
              this.updateCastling();

              this.moves = this.findAllChildrenMoves(this);
      }

      updateFromMove(newSquare, piece) {
              var originalPosition = {...piece.position}
              var position = this.getRowColPositionFromSquare(newSquare);
              this.board[position.row][position.column].piece = piece;
              this.board[position.row][position.column].isEmpty = false;
              this.board[piece.position.row][piece.position.column] = new Square();
              piece.position = piece.getRowColPositionFromSquare(newSquare);

              this.updateGameState(position, piece, originalPosition);
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

      findPiecesToCreateGameStates(chessGame) { //locates all pieces which may eventuate to new game states
              var pieces = [];
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
                  this.turn = "black";
            } else {
                  this.turn = "white";
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
                                  this.pieces[piece.color][piece.type+"s"].push(piece);
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
