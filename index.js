const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3030;

app.use(cors());
app.use(express.json());

const games = {}; // In-memory storage

app.get("/create", (req, res) => {
    res.send("HelloWOrld");
});

// Create a new game
app.post("/create", (req, res) => {
    const gameId = Math.random().toString(36).substr(2, 9);
    games[gameId] = {
        board: [["", "", ""], ["", "", ""], ["", "", ""]],
        players: {},
        currentTurn: "X",
        winner: null
    };
    console.log("game has been created id is: "+gameId);
    res.send({ gameId });
});

// Join a game
app.post("/join/:gameId", (req, res) => {
    const { gameId } = req.params;
    const { uid } = req.body;
    const game = games[gameId];
    if (!game) return res.status(404).send("Game not found");

    const playerSymbol = Object.keys(game.players).length === 0 ? "X" : "O";
    if (game.players[playerSymbol]) return res.status(400).send("Game full");

    game.players[playerSymbol] = uid;
    res.send({ symbol: playerSymbol });
});

// Make a move
app.post("/move/:gameId", (req, res) => {
    const { gameId } = req.params;
    const { uid, row, col } = req.body;
    const game = games[gameId];
    if (!game) return res.status(404).send("Game not found");

    const symbol = Object.keys(game.players).find(k => game.players[k] === uid);
    if (!symbol) return res.status(403).send("Not a player");
    if (game.currentTurn !== symbol) return res.status(400).send("Not your turn");
    if (game.board[row][col]) return res.status(400).send("Cell taken");

    game.board[row][col] = symbol;
    game.currentTurn = symbol === "X" ? "O" : "X";
    const result = checkGameOver(game.board);
    if (result.status === 'win' || result.status === 'draw') {
        game.status = result.status;
        game.winner = result.winner || null;
    }

    res.send({ board: game.board, nextTurn: game.currentTurn, winner: game.winner });
});

app.get("/status/:gameId", (req, res) => {
    const game = games[req.params.gameId];
    if (!game) return res.status(404).send("Game not found");
    res.send({ board: game.board, currentTurn: game.currentTurn, winner: game.winner });
});

function checkGameOver(board) {
    const lines = [
        // Rows
        [board[0][0], board[0][1], board[0][2]],
        [board[1][0], board[1][1], board[1][2]],
        [board[2][0], board[2][1], board[2][2]],
        // Columns
        [board[0][0], board[1][0], board[2][0]],
        [board[0][1], board[1][1], board[2][1]],
        [board[0][2], board[1][2], board[2][2]],
        // Diagonals
        [board[0][0], board[1][1], board[2][2]],
        [board[0][2], board[1][1], board[2][0]],
    ];

    for (const line of lines) {
        if (line[0] && line[0] === line[1] && line[1] === line[2]) {
            return { status: 'win', winner: line[0] };
        }
    }

    const isDraw = board.every(row => row.every(cell => cell));
    if (isDraw) return { status: 'draw' };

    return { status: 'ongoing' };
}



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
