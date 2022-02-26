import {
    GameGraphics
} from "./game.graphics.js";

export class GameMinimax extends GameGraphics {
    constructor(depth, isMinimaxBlack) {
        super();

        this.depth = depth;
        this.isMinimaxBlack = isMinimaxBlack;
        this.minimaxTurn = isMinimaxBlack ? this.STATE.BLACK_TURN : this.STATE.WHITE_TURN;

        // Minimaxs play first
        if (isMinimaxBlack) {
            // Block humain from playing while minimax is playing
            this.cleanPreviousLegalMoves();

            this.minimaxPlay();
        }
    }

    minimaxPlay() {
        const gameClone = this.clone();
        const depth = this.depth;

        // Run minimax in a worker to avoid blocking
        const worker = new Worker('src/minimax.worker.js', {
            type: 'module'
        });

        worker.postMessage({
            gameClone,
            depth
        });

        worker.onmessage = (event) => {
            const evals = event.data;

            // Play best move
            // https://stackoverflow.com/a/50723439/11060940
            const best = Object.entries(evals).reduce((a, b) => a[1] > b[1] ? a : b)[0];
            this.placePiece(best);
        }
    }


    // Override to allow minimax play
    mouseAction(move) {
        this.placePiece(move);

        // Check victory
        if (this.isVictory()) {
            this.endGame();
        }
        // Check skip problem to avoid color switching or double color play
        // Minimaw can only play if it's it turn
        else if (this.state == this.minimaxTurn) {
            // Block humain from playing while minimax is playing
            this.cleanPreviousLegalMoves();

            this.minimaxPlay();
        }
    }
}