// A square holds a piece or is empty
class Square {
      constructor(piece) {
            if (piece == undefined) {
                  this.isEmpty = true;
                  this.piece = undefined;
            } else {
                  this.isEmpty = false;
                  this.piece = piece;
            }
      }
}
