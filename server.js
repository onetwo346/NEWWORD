const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for local testing; restrict in production
    methods: ["GET", "POST"],
  },
});

const games = {}; // Store active games by pin code

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("joinGame", ({ pinCode, playerId }) => {
    if (!games[pinCode]) {
      games[pinCode] = {
        players: [{ socket, id: playerId }],
        board: Array(9).fill(null),
        turn: "X",
      };
      socket.emit("status", "Waiting for an opponent to join the cosmos...");
    } else if (games[pinCode].players.length === 1 && games[pinCode].players[0].id !== playerId) {
      games[pinCode].players.push({ socket, id: playerId });
      const [player1, player2] = games[pinCode].players;
      player1.socket.emit("gameStart", { board: games[pinCode].board, turn: "X", symbol: "X" });
      player2.socket.emit("gameStart", { board: games[pinCode].board, turn: "X", symbol: "O" });
    } else {
      socket.emit("status", "This cosmic arena is full or you’re already in it!");
    }
  });

  socket.on("makeMove", ({ pinCode, index, player }) => {
    const game = games[pinCode];
    if (game && game.turn === player && !game.board[index]) {
      game.board[index] = player;
      game.turn = player === "X" ? "O" : "X";
      game.players.forEach((p) => p.socket.emit("updateBoard", game.board));
      if (checkWin(game.board, player)) {
        game.players.forEach((p) => p.socket.emit("gameOver", `${player} Conquers the Cosmos!`));
      } else if (game.board.every((cell) => cell)) {
        game.players.forEach((p) => p.socket.emit("gameOver", "Cosmic Stalemate!"));
      }
    }
  });

  socket.on("chatMessage", ({ pinCode, message }) => {
    if (games[pinCode]) {
      games[pinCode].players.forEach((p) => p.socket.emit("chat", message));
    }
  });

  socket.on("disconnect", () => {
    for (let pin in games) {
      const game = games[pin];
      const playerIndex = game.players.findIndex((p) => p.socket === socket);
      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);
        if (game.players.length === 0) {
          delete games[pin];
        } else {
          game.players.forEach((p) => p.socket.emit("opponentDisconnected"));
        }
      }
    }
  });
});

function checkWin(board, player) {
  const wins = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  return wins.some((combo) => combo.every((i) => board[i] === player));
}

server.listen(3000, () => console.log("Cosmic server running on port 3000"));
