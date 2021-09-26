// A chess piece

class Piece {
      constructor(color, type, square) { //square can be a number from 0-63 or row, column, and square data
            this.color = color;
            this.type = type;
            this.image = color + "_" + type;

            if (square.row == undefined || square.column == undefined) {
                  this.position = this.getRowColPositionFromSquare(square);
                  this.position.square = square;
            } else {
                  this.position = square;
                  this.position.square = square;
            }

            this.pinned = false;
            this.pinnedSquares = []; //array of all allowed squares to moved when pinned
            this.legalMoves = {
                  captures : [],
                  moves : []
            };
      }

      promoteToType(type) {
            this.type = type;
            this.image = this.color + "_" + type;
      }

      getDirectionFromDifference(rowDifference, columnDifference) {
            return { // x || 1 avoids division by 0
                  row : rowDifference / (Math.abs(rowDifference) || 1),
                  column : columnDifference / (Math.abs(columnDifference) || 1)
            }
      }

      getAttackingLine(gameState, king) {
              var lineOfSight = [];
              var rowDifference = king.position.row - this.position.row;
              var columnDifference = king.position.column - this.position.column;
              var direction = this.getDirectionFromDifference(rowDifference, columnDifference);
              var movePosition = {...this.position};
              while (king.position.row != movePosition.row || king.position.column != movePosition.column) {
                      movePosition = this.newPositionFromDirection(movePosition, direction);
                      lineOfSight.push(movePosition.square);
              }
              return lineOfSight;
      }

      getInterceptingSquares(gameState, king) {
              var interceptingSquares = [this.position.square];
              if (this.type == "knight" || this.type == "pawn") {
                    return interceptingSquares;
              }
              var lineOfSight = this.getAttackingLine(gameState, king);
              interceptingSquares = interceptingSquares.concat(lineOfSight);
              return interceptingSquares;
      }

      getAllLegalMoves(gameState) {
              var legalMoves;
              var legalPositions = [];
              if (gameState.kingInCheck) { //add check restrictions
                      var attacker = gameState.kingAttackers[0]; //only one attacker if piece isn't king
                      legalPositions = attacker.interceptingPositions; //includes its position and lineOfSight
              }
              if (this.pinned) {
                      if (legalPositions.length != 0) {
                              legalPositions = legalPositions.filter(value=>this.pinnedSquares.includes(value)); //intersection between intersection of check and pinned
                      } else {
                              legalPositions = this.pinnedSquares;
                      }
              }
              if (this.type == "rook" || this.type == "queen" || this.type == "bishop") {
                      legalMoves = this.getSlidingMoves(gameState, legalPositions, this.type);
              }
              if (this.type == "king") {
                      legalMoves = this.getKingMoves(gameState, legalPositions);
              }
              if (this.type == "knight") {
                      legalMoves = this.getKnightMoves(gameState, legalPositions);
              }
              if (this.type == "pawn") {
                      legalMoves = this.getPawnMoves(gameState, legalPositions);
              }
              this.legalMoves = legalMoves;
              return legalMoves;
      }

      getSlidingDirections(type) {
            var directions = [];
            if (type == "rook" || type == "queen") {
                    directions = directions.concat(
                            [{column : -1, row : 0, type : "rook"},
                            {column : 1, row : 0, type : "rook"},
                            {column : 0, row : -1, type : "rook"},
                            {column : 0, row : 1, type : "rook"},
                            ]
                    );
            }
            if (type == "bishop" || type == "queen") {
                    directions = directions.concat(
                            [{column : -1, row : -1, type : "bishop"},
                            {column : 1, row : -1, type : "bishop"},
                            {column : -1, row : 1, type : "bishop"},
                            {column : 1, row : 1, type : "bishop"},
                            ]
                    );
            }
            return directions;
      }

      getOneSpaceMove(position, gameState) {
            if (this.positionIsOutOfBounds(position)) {
                  return {
                        target : undefined,
                        final : true
                  };
            }
            var square = this.squareAtPosition(gameState.board, position);
            if (square.isEmpty) { //mvoe into empty space
                  return {
                        target : "empty",
                        final : false
                  };
            }
            if (square.piece.color == gameState.turn) { //collided with own piece
                  return {
                        target : "friendly",
                        final : true
                  };
            }
            if (square.piece.color != gameState.turn) { //collided with enemy piece
                  return {
                        target : "enemy",
                        final : true
                  };
            };
            return {
                  target : undefined,
                  final : true
            };
      }

      squareAtPosition(board, position) {
              return board[position.row][position.column];
      }

      positionIsOutOfBounds(position) {
            if (position.row < 0 || position.row > 7 || position.column < 0 || position.column > 7) {
                  return true;
            }
            return false;
      }

      moveIsLegal(move, legalPositions) {
            return (legalPositions.includes(move.square) || (legalPositions.length == 0 && !this.pinned));
      }

      getMovesInDirection(legalMoves, startingPosition, direction, gameState, legalPositions, findingPins) {
              var newPosition = this.newPositionFromDirection(startingPosition, direction)
              var moveEnd = false;
              while (!this.positionIsOutOfBounds(newPosition) && !moveEnd) {
                    var moveResult = this.getOneSpaceMove(newPosition, gameState);
                    moveEnd = moveResult.final; //if its the final move then escape the loop
                    var move = {...newPosition};
                    if (moveResult.target == "empty" && this.moveIsLegal(move, legalPositions)) {
                            legalMoves.moves.push(move);
                    }
                    newPosition.row += direction.row;
                    newPosition.column += direction.column;
                    newPosition.square = newPosition.row * 8 + newPosition.column;
              }
              if (moveResult != undefined && moveResult.target == "enemy" && this.moveIsLegal(move, legalPositions)) {
                      move.captureTarget = this.squareAtPosition(gameState.board, move);
                      legalMoves.captures.push(move);
              }
              if (findingPins && moveResult != undefined && (moveResult.target == "friendly" || moveResult.target == "enemy")) { //for finding pins
                    move.piece = this.squareAtPosition(gameState.board, move).piece;
                    legalMoves.endPoint = move;
              }
              return legalMoves;
      }

      getSlidingMoves(gameState, legalPositions, type) { //rook, bishop, queen
            var legalMoves = {
                  captures : [],
                  moves : [],
                  piece : this
            };
            var directions = this.getSlidingDirections(type);
            var startingPosition = {...this.position};
            for (var i=0; i < directions.length; i++) {
                    var legalMoves = this.getMovesInDirection(legalMoves, startingPosition, directions[i], gameState, legalPositions);
            }
            return legalMoves;
      }

      getKingMoves(gameState, legalPositions) {
            var legalMoves = {
                  captures : [],
                  moves : []
            };
            var legalPositions = []; //king is never restricted
            var kingDirections = this.getKingDirections();
            for (var i=0; i < kingDirections.length; i++) {
                  var move = this.newPositionFromDirection(this.position, kingDirections[i]);
                  var moveResult = this.getOneSpaceMove(move, gameState);
                  if (moveResult != undefined && moveResult.target == "empty" && this.moveIsLegal(move, legalPositions) && !gameState.squaresInCheck.includes(move.square)) {
                          legalMoves.moves.push(move);
                  }
                  if (moveResult != undefined && moveResult.target == "enemy" && this.moveIsLegal(move, legalPositions) && !gameState.squaresInCheck.includes(move.square)) {
                          legalMoves.captures.push(move);
                  }
            }

            if (gameState.tempCastlingRights[gameState.turn].kingSide && !gameState.kingInCheck) {
                    move = this.getRowColPositionFromSquare(gameState.getKingSideSquares()[1]);
                    move.piece = this;
                    move.castle = true;
                    legalMoves.moves.push(move);
            }
            if (gameState.tempCastlingRights[gameState.turn].queenSide && !gameState.kingInCheck) {
                    move = this.getRowColPositionFromSquare(gameState.getQueenSideSquares()[1]);
                    move.piece = this;
                    move.castle = true;
                    legalMoves.moves.push(move);
            }

            return legalMoves;
      }


      getPawnDirection() {
            if (this.color == "white") {
                  return -1;
            }
            return 1;
      }

      newPositionFromDirection(position, direction) {
            return {
                  row : position.row + direction.row,
                  column : position.column + direction.column,
                  square : (position.row + direction.row)*8 + position.column + direction.column,
                  piece : this
            };
      }

      canDoubleMove() {
            if (this.color == "white" && this.position.row == 6) {
                  return true;
            }
            if (this.color == "black" && this.position.row == 1) {
                  return true;
            }
            return false;
      }

      getPawnMoves(gameState, legalPositions) {
            var legalMoves = {
                  captures : [],
                  moves : [],
                  piece : this
            };
            var rowDirection = this.getPawnDirection();

            var move = this.newPositionFromDirection(this.position, {column : 0, row : rowDirection});
            var singleMove = this.getOneSpaceMove(move, gameState);
            if (singleMove.target == "empty" && this.moveIsLegal(move, legalPositions)) {
                  legalMoves.moves.push(move);
                  move = this.newPositionFromDirection(this.position, {column : 0, row : rowDirection*2});
                  var doubleMove = this.getOneSpaceMove(move, gameState);
                  if (doubleMove.target == "empty" && this.moveIsLegal(move, legalPositions) && this.canDoubleMove()) {
                        legalMoves.moves.push(move);
                  }
            }
            move = this.newPositionFromDirection(this.position, {column : -1, row : rowDirection});
            var leftTake = this.getOneSpaceMove(move, gameState);
            if (leftTake.target == "enemy" && this.moveIsLegal(move, legalPositions)) {
                  move.captureTarget = this.squareAtPosition(gameState.board, move);
                  legalMoves.captures.push(move);
            }
            if (gameState.enpassantTargetSquare != undefined && move.square == gameState.enpassantTargetSquare.square) {
                  move.enpassant = true;
                  legalMoves.moves.push(move);
            }
            move = this.newPositionFromDirection(this.position, {column : 1, row : rowDirection});
            var rightTake = this.getOneSpaceMove(move, gameState);
            if (rightTake.target == "enemy" && this.moveIsLegal(move, legalPositions)) {
                  move.captureTarget = this.squareAtPosition(gameState.board, move);
                  legalMoves.captures.push(move);
            }
            if (gameState.enpassantTargetSquare != undefined && move.square == gameState.enpassantTargetSquare.square) {
                  move.enpassant = true;
                  legalMoves.moves.push(move);
            }
            return legalMoves;
      }

      getKnightMoves(gameState, legalPositions) {
            var legalMoves = {
                  captures : [],
                  moves : [],
                  piece : this
            };
            var knightDirections = this.getKnightDirections();
            for (var i=0; i < knightDirections.length; i++) {
                  var move = this.newPositionFromDirection(this.position, knightDirections[i]);
                  var moveResult = this.getOneSpaceMove(move, gameState);
                  if (moveResult != undefined && moveResult.target == "empty" && this.moveIsLegal(move, legalPositions)) {
                          legalMoves.moves.push(move);
                  }
                  if (moveResult != undefined && moveResult.target == "enemy" && this.moveIsLegal(move, legalPositions)) {
                          move.captureTarget = this.squareAtPosition(gameState.board, move);
                          legalMoves.captures.push(move);
                  }
            }
            return legalMoves;
      }

      getKingDirections() {
            return [
            {column : 1, row : 1},
            {column : 1, row : -1},
            {column : -1, row : 1},
            {column : -1, row : -1},
            {column : 0, row : 1},
            {column : 0, row : -1},
            {column : -1, row : 0},
            {column : 1, row : 0},
            ];
      }

      getKnightDirections() {
            return [
            {column : 1, row : 2},
            {column : 1, row : -2},
            {column : -1, row : 2},
            {column : -1, row : -2},
            {row : 1, column : 2},
            {row : 1, column : -2},
            {row : -1, column : 2},
            {row : -1, column : -2},
            ];
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
}
