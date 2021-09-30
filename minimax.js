class MiniMax {
      constructor(getChildren, staticEval, gameEnd) {
            this.getChildren = getChildren,
            this.staticEvaluation = staticEval,
            this.gameEnd = gameEnd,
            this.counter = 0
      }

      start(position, depth, maxPlayer) {
            return this.minimax(position, depth, maxPlayer, depth, -Infinity, Infinity);
      }

      minimax(position, depth, maxPlayer, originalDepth, alpha, beta) {
            if (depth == originalDepth) {
                this.counter = 0;
            }

            this.counter++;

            if (this.gameEnd(position) || depth == 0) {
                  return this.staticEvaluation(position, depth);
            }

            if (maxPlayer) {
                  var maxEval = -Infinity;
                  var children = this.getChildren(position);
                  var bestChild = 0;
                  for (var i=0; i < children.length; i++) {
                        var evaluation = this.minimax(children[i], depth-1, false, originalDepth, alpha, beta);
                        if (evaluation > maxEval) {
                              bestChild = i;
                        }
                        maxEval = Math.max(evaluation, maxEval);
                        alpha = Math.max(alpha, evaluation);
                        if (beta <= alpha) {
                            break;
                        }
                  }

                  if (depth == originalDepth) {
                        console.log("Searched " + this.counter + " positions.");
                        return children[bestChild];
                  }

                  return maxEval;
            } else {
                var minEval = Infinity;
                var children = this.getChildren(position);
                for (var i=0; i < children.length; i++) {
                      var evaluation = this.minimax(children[i], depth-1, true, originalDepth, alpha, beta);
                      minEval = Math.min(evaluation, minEval);
                      beta = Math.min(beta, evaluation);
                      if (beta <= alpha) {
                          break;
                      }
                }
                return minEval;
            }
      }
}
