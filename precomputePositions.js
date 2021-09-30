// new : board is indexed from squares 0-63 where 0 is the top left square
const UP = -8;
const DOWN = 8;
const LEFT = -1;
const RIGHT = 1;
const UP_LEFT = UP + LEFT;
const UP_RIGHT = UP + RIGHT;
const DOWN_LEFT = DOWN + LEFT;
const DOWN_RIGHT = DOWN + RIGHT;

//first four indexes are rook moves, last four indexes are bishop moves
const DIRECTIONS = [UP, DOWN, LEFT, RIGHT, UP_LEFT, UP_RIGHT, DOWN_LEFT, DOWN_RIGHT];
const KNIGHT_DIRECTIONS = [UP*2 + LEFT, UP*2 + RIGHT, DOWN*2 + LEFT, DOWN*2 + RIGHT, LEFT*2 + UP, LEFT*2 + DOWN, RIGHT*2 + UP, RIGHT*2 + DOWN];

//squares where a pawn begins
const WHITE_PAWN_STARTING_POSITIONS = [48, 49, 50, 51, 52, 53, 54, 55];
const BLACK_PAWN_STARTING_POSITIONS = [8, 9, 10, 11, 12, 13, 14, 15];

//I can't be bothered doing modulus math
const KNIGHT_LEFT_EDGE = [0, 1, 8, 9, 16, 17, 24, 25, 32, 33, 40, 41, 48, 49, 56, 57];
const KNIGHT_RIGHT_EDGE = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63];

//these are constant values that assume an ideal board state where pieces can move freely and pawns are always able to capture and complete enpassant
var pieceMovesAtSquare = { //each piece array will have 64 squares indexed 0-63
      bishop : [],
      rook : [],
      queen : [],
      king : [],
      white : {
          pawnMoves : [],
          pawnCaptures : [],
      },
      black : {
            pawnMoves : [],
            pawnCaptures : [],
      },
      knight : [],
};

function squareIsInBounds(square) {
      if (square < 0 || square > 63) {
            return false;
      }
      return true;
}

function squareIsInLeftOrRightBounds(square, direction) { //because the final square on the row should be counted
      var horizontalDirection = (direction == LEFT || direction == UP_LEFT || direction == DOWN_LEFT) ? LEFT : RIGHT;

      //direction to mod, gives this function : (direction + 1) * 7 / 2 such that
      //direction -1 == mod 0
      //direction 1 == mod 7
      if ((square - horizontalDirection) % 8 == (horizontalDirection + 1) * 7 / 2) {
            return false;
      }
      return true;
}

function squareIsInKnightBounds(square, direction) {
        if ( ( KNIGHT_LEFT_EDGE.includes(square+direction) && KNIGHT_RIGHT_EDGE.includes(square) ) || ( KNIGHT_RIGHT_EDGE.includes(square+direction) && KNIGHT_LEFT_EDGE.includes(square) ) ) {
                return false;
        }
        return true;
}

function getMovesInDirectionFromSquare(square, direction) { //squrae of piece, direction the piece is moving
      //move in a direction until I hit the edge of the board
      var squares = [];
      var currSquare = square + direction;
      var testLeftRightBounds = (direction == UP || direction == DOWN) ? false : true;
      while (squareIsInBounds(currSquare) && (!testLeftRightBounds || squareIsInLeftOrRightBounds(currSquare, direction)) ) {
              squares.push(currSquare);
              currSquare += direction;
      }
      return squares; //returns array of valid squares
}

function getPieceSlidingMovesFromSquare(piece, square) {
        var directionStartIndex = (piece == "bishop") ? 4 : 0;
        var directionEndIndex = (piece == "rook") ? 4 : 8;
        var movesInAllDirections = [];
        for (var i=directionStartIndex; i < directionEndIndex; i++) {
              var direction = DIRECTIONS[i];
              var movesInDirection = getMovesInDirectionFromSquare(square, direction);
              if (movesInDirection.length != 0) {
                    movesInAllDirections.push(movesInDirection);
              }
        }
        return movesInAllDirections; //returns two dimensional array of moves in each direction
}

function getOneSpaceMoveInDirectionFromSquare(square, direction, piece) {
        var newSquare = square + direction;
        var testLeftRightBounds = !(direction == UP || direction == DOWN || piece == "knight");
        var testKnightOutOfBounds = (piece == "knight");
        if (squareIsInBounds(newSquare) && (!testLeftRightBounds || squareIsInLeftOrRightBounds(square, direction)) && (!testKnightOutOfBounds || squareIsInKnightBounds(square, direction)) ) {
                return newSquare;
        }
}

function getDirectionsFromPiece(color, piece) {
        if (piece == "knight") return KNIGHT_DIRECTIONS;
        if (piece == "king") return DIRECTIONS;
        var forwardDirection = (color == "white") ? [UP] : [DOWN];
        if (piece == "pawnMoves") return forwardDirection;
        var captureDirections = (color == "white") ? [UP_LEFT, UP_RIGHT] : [DOWN_LEFT, DOWN_RIGHT];
        if (piece == "pawnCaptures") return captureDirections;
}


function getOneSpacesMovesOfPieceFromSquare(color, piece, square) {
        var directions = getDirectionsFromPiece(color, piece);
        var movesInAllDirections = [];
        for (var i=0; i < directions.length; i++) {
              var direction = directions[i];
              var movesInDirection = getOneSpaceMoveInDirectionFromSquare(square, direction, piece);
              if (movesInDirection != undefined) {
                    movesInAllDirections.push(movesInDirection);
              }
        }
        return movesInAllDirections; //returns two dimensional array of moves in each direction
}

function getPawnDoubleMoves() {
        var colors = ["white", "black"];
        for (var c=0; c < colors.length; c++) {
              var color = colors[c];
              var squaresToAddDoubleMove = (color == "white") ? WHITE_PAWN_STARTING_POSITIONS : BLACK_PAWN_STARTING_POSITIONS;
              for (var s=0; s < squaresToAddDoubleMove.length; s++) {
                      var square = squaresToAddDoubleMove[s];
                      var forwardDirection = (color == "white") ? UP : DOWN;
                      var newSquare = square + forwardDirection * 2;
                      pieceMovesAtSquare[color].pawnMoves[square].push(newSquare);
              }
        }
}

function getSlidingMovesForAllSquares() {
        var pieces = ["bishop", "rook", "queen"];
        for (var p=0; p < pieces.length; p++) {
              var piece = pieces[p];
              for (var square=0; square <= 63; square++) {
                    var squareMoves = getPieceSlidingMovesFromSquare(piece, square);
                    pieceMovesAtSquare[piece].push(squareMoves);
              }
        }
}

function getOneSpacesMovesForAllSquares() {
        var pieces = ["king", "knight", "pawnMoves", "pawnCaptures"];
        var colors = ["white", "black"];
        for (var p=0; p < pieces.length; p++) {
              var piece = pieces[p];
              var iterateLength = (piece == "pawnMoves" || piece == "pawnCaptures") ? 2 : 1;
              for (var c=0; c < iterateLength; c++) {
                      var color = colors[c];
                      for (var square=0; square <= 63; square++) {
                            var squareMoves = getOneSpacesMovesOfPieceFromSquare(color, piece, square);
                            if (iterateLength == 1) {
                                  pieceMovesAtSquare[piece].push(squareMoves);
                            } else { //pawn moves are nested in colors
                                  pieceMovesAtSquare[color][piece].push(squareMoves);
                            }
                      }
              }
        }
}

function getMovesFromSquare(type, square, color) {
        if (color == undefined) {
              return pieceMovesAtSquare[type][square];
        } else {
              return pieceMovesAtSquare[color][type][square];
        }
}

getSlidingMovesForAllSquares();
getOneSpacesMovesForAllSquares();
getPawnDoubleMoves();
