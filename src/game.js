export class Game {
  constructor() {
    // Board properties
    this.BOARD_LENGTH = 8;

    this.STATE = {
      'BLACK_TURN': 0,
      'WHITE_TURN': 1,
      'WIN_BLACK': 2,
      'WIN_WHITE': 3,
      'DRAW': 4
    }

    this.previousNoMoveCount = 0;

    // Pieces
    this.BLACK_PIECE = {
      value: 1
    };
    this.WHITE_PIECE = {
      value: 2
    };

    // Initialize game
    this.resetGame();
  }

  resetGame() {
    // Clean board
    this.board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 2, 1, 0, 0, 0],
      [0, 0, 0, 1, 2, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    // Piece counters
    this.blackPiecesCount = 2;
    this.whitePiecesCount = 2;

    // Surrounding cells
    this.surroundingCells = new Set([
      'c3', 'c4', 'c5', 'c6',
      'd3', 'd6',
      'e3', 'e6',
      'f3', 'f4', 'f5', 'f6'
    ]);

    // Set turn to Black
    this.state = this.STATE.BLACK_TURN;

    // All possibles sandwiches per legal move
    this.updateSandwiches(this.BLACK_PIECE.value);
  }

  placePiece(cell) {
    // Add piece value in board
    const pieceValue = (this.state == this.STATE.BLACK_TURN) ? this.BLACK_PIECE.value : this.WHITE_PIECE.value;
    const index = this.cellToIndex(cell);
    this.board[index[0]][index[1]] = pieceValue;

    // Update piece count
    if (this.state == this.STATE.BLACK_TURN) {
      this.blackPiecesCount++;
    } else {
      this.whitePiecesCount++;
    }

    // Cells element that will need to be updated
    const cellsToUpdate = [cell];

    // Flip pieces in sandwich
    for (const cellToSwitch of this.sandwiches[cell]) {
      const pieceIndex = this.cellToIndex(cellToSwitch);

      if (this.state == this.STATE.BLACK_TURN) {
        this.board[pieceIndex[0]][pieceIndex[1]] = this.BLACK_PIECE.value;

        // Update piece counters
        this.blackPiecesCount++;
        this.whitePiecesCount--;
      } else {
        this.board[pieceIndex[0]][pieceIndex[1]] = this.WHITE_PIECE.value;

        // Update piece counters
        this.whitePiecesCount++;
        this.blackPiecesCount--;
      }

      cellsToUpdate.push(cellToSwitch);
    }

    this.updateSurroundingCell(cell);
    this.updateSandwiches(
      (this.state == this.STATE.BLACK_TURN) ? this.WHITE_PIECE.value : this.BLACK_PIECE.value
    );

    if (!this.isVictory()) {
      this.switchPlayerTurn();
      this.isNoMoreMove();
    }

    return cellsToUpdate;
  }

  isNoMoreMove() {
    if (Object.keys(this.sandwiches).length == 0) {
      this.skipPlayerTurn();
    } else {
      this.previousNoMoveCount = 0;
    }

    if (this.previousNoMoveCount == 2) {
      // Effective draw
      if (this.blackPiecesCount == this.whitePiecesCount) {
        this.state = this.STATE.DRAW;
      } else {
        // Win by pieces count
        this.state = (this.blackPiecesCount > this.whitePiecesCount) ? this.STATE.WIN_BLACK : this.STATE.WIN_WHITE;
      }

      return true;
    }

    return false;
  }

  skipPlayerTurn() {
    this.previousNoMoveCount++;
    this.updateSandwiches(
      (this.state == this.STATE.BLACK_TURN) ? this.WHITE_PIECE.value : this.BLACK_PIECE.value
    );
    this.switchPlayerTurn();
  }

  switchPlayerTurn() {
    this.state = (this.state == this.STATE.BLACK_TURN) ? this.STATE.WHITE_TURN : this.STATE.BLACK_TURN;
  }

  isVictory() {
    // White
    if (this.blackPiecesCount == 0) {
      this.state = this.STATE.WIN_WHITE;
      return true;
    }

    // Black
    if (this.whitePiecesCount == 0) {
      this.state = this.STATE.WIN_BLACK;
      return true;
    }

    // No more empty cell
    if ((this.blackPiecesCount + this.whitePiecesCount) == 64) {
      // Effective draw
      if (this.blackPiecesCount == this.whitePiecesCount) {
        this.state = this.STATE.DRAW;
      } else {
        // Win by pieces count
        this.state = (this.blackPiecesCount > this.whitePiecesCount) ? this.STATE.WIN_BLACK : this.STATE.WIN_WHITE;
      }

      return true;
    }

    return false;
  }

  getCellEmptyNeighbors(cell) {
    // Retrieve cell grid indexes
    const cellIndex = this.cellToIndex(cell);
    const i = parseInt(cellIndex[0]);
    const j = parseInt(cellIndex[1]);

    const neighbors = [];

    // Loop through neighbors
    // Optimization → https://stackoverflow.com/a/67758639
    for (let x = -1; x < 2; x++) {
      for (let y = -1; y < 2; y++) {
        if (!(x == 0 && y == 0)) {
          const nX = i + x;
          const nY = j + y;

          if ((nX >= 0 && nX < this.BOARD_LENGTH) && (nY >= 0 && nY < this.BOARD_LENGTH)) {
            // Check if cell is empty
            if (this.board[nX][nY] == 0) {
              neighbors.push(this.indexToCell(nX, nY));
            }
          }
        }
      }
    }

    return neighbors;
  }

  indexToCell(row, column) {
    return String.fromCharCode(97 + column) + (row + 1);
  }

  cellToIndex(cell) {
    // Retrieve letter code and number
    const letterCode = cell[0].charCodeAt(0);
    const number = cell[1];

    return [number - 1, letterCode % 97];
  }

  updateSandwiches(pieceValue) {
    this.sandwiches = [];
    for (const cell of this.surroundingCells) {
      this.searchSandwiches(cell, pieceValue)
    }
  }

  searchSandwiches(cell, pieceValue) {
    // Retrieve cell grid indexes
    const cellIndex = this.cellToIndex(cell);
    const i = parseInt(cellIndex[0]);
    const j = parseInt(cellIndex[1]);

    let isSandwich = false;
    const arraySandwiches = [];

    // Loop through neighbors
    // Optimization → https://stackoverflow.com/a/67758639
    for (let x = -1; x < 2; x++) {
      for (let y = -1; y < 2; y++) {
        if (!(x == 0 && y == 0)) {
          const nX = i + x;
          const nY = j + y;

          if ((nX >= 0 && nX < this.BOARD_LENGTH) && (nY >= 0 && nY < this.BOARD_LENGTH)) {
            // check if opposite color piece
            const v = this.board[nX][nY];
            if (v != 0 && v != pieceValue) {
              // check if sandwiches are possible
              const piecesInSandwich = this.getSandwich(cellIndex, pieceValue, [x, y]);
              if (piecesInSandwich != null) {
                arraySandwiches.push(piecesInSandwich);
                isSandwich = true;
              }
            }
          }
        }
      }
    }

    // Store sandwiches if any
    if (isSandwich) {
      // Avoid nested arrays
      this.sandwiches[cell] = arraySandwiches.flat();
      // Increment array length
      this.sandwiches.length++;
    }

    return isSandwich;
  }

  getSandwich(cellIndex, pieceValue, direction) {
    const nextPiecesIndexes = this.getAllPiecesIndexesTowards(cellIndex, direction);
    const piecesBetween = [];

    // Loop through until same color piece
    for (const pieceIndex of nextPiecesIndexes) {
      if (this.board[pieceIndex[0]][pieceIndex[1]] == pieceValue) {
        return piecesBetween;
      }
      piecesBetween.push(this.indexToCell(pieceIndex[0], pieceIndex[1]));
    }

    return null;
  }

  getAllPiecesIndexesTowards(cellIndex, direction) {
    let i = cellIndex[0];
    let j = cellIndex[1];

    const dX = direction[0];
    const dY = direction[1];

    const cellsIndexes = [];

    // Step forward until its reach border
    while (
      (0 <= (i += dX) && i < this.BOARD_LENGTH) &&
      (0 <= (j += dY) && j < this.BOARD_LENGTH)
    ) {
      // Check cell has a piece
      if (this.board[i][j] != 0) {
        cellsIndexes.push([i, j]);
      } else {
        break;
      }
    }

    return cellsIndexes;
  }

  updateSurroundingCell(placedCell) {
    this.surroundingCells.delete(placedCell);
    for (const surroundingCell of this.getCellEmptyNeighbors(placedCell)) {
      this.surroundingCells.add(surroundingCell);
    }
  }

  loadTranscript(matchString) {
    this.resetGame();

    // Split string in segment of two characters
    for (const cell of matchString.match(/.{1,2}/g)) {
      this.placePiece(cell);
    }
  }

  getAllBlackCell() {
    const blackCells = [];

    for (let row = 0; row < this.BOARD_LENGTH; row++) {
      for (let col = 0; col < this.BOARD_LENGTH; col++) {
        if (this.board[row][col] == this.BLACK_PIECE.value) {
          blackCells.push(this.indexToCell(row, col));
        }
      }
    }

    return blackCells;
  }

  getAllWhiteCell() {
    const whiteCells = [];

    for (let row = 0; row < this.BOARD_LENGTH; row++) {
      for (let col = 0; col < this.BOARD_LENGTH; col++) {
        if (this.board[row][col] == this.WHITE_PIECE.value) {
          whiteCells.push(this.indexToCell(row, col));
        }
      }
    }

    return whiteCells;
  }

  getNumberPieceInCorner(pieceValue) {
    let count = 0;

    // a1
    count += (this.board[0][0] == pieceValue) ? 1 : 0;
    // a8
    count += (this.board[7][0] == pieceValue) ? 1 : 0;
    // h1
    count += (this.board[0][7] == pieceValue) ? 1 : 0;
    // h8
    count += (this.board[7][7] == pieceValue) ? 1 : 0;

    return count;
  }

  /* istanbul ignore next */
  // StructuredClone is not supported in Node.js
  clone() {
    const gameClone = new Game();

    // Clone properties without reference
    gameClone.board = structuredClone(this.board);
    gameClone.blackPiecesCount = structuredClone(this.blackPiecesCount);
    gameClone.whitePiecesCount = structuredClone(this.whitePiecesCount);
    gameClone.surroundingCells = structuredClone(this.surroundingCells);
    gameClone.state = structuredClone(this.state);
    gameClone.sandwiches = structuredClone(this.sandwiches);
    gameClone.previousNoMoveCount = structuredClone(this.previousNoMoveCount);

    return gameClone;
  }
}