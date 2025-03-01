const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Restrict in production
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const games = {}; // Store active games by pin code

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("createGame", ({ pinCode, playerId }) => {
    if (games[pinCode]) {
      socket.emit("error", "This game code is already in use. Try creating a new one.");
      return;
    }
    games[pinCode] = {
      players: [{ socket, id: playerId, symbol: "X" }],
      board: Array(9).fill(null),
      turn: "X",
    };
    socket.emit("gameCreated");
  });

  socket.on("joinGame", ({ pinCode, playerId }) => {
    const game = games[pinCode];
    if (!game) {
      socket.emit("error", "Friend's game code not found. Please check the code.");
      return;
    }
    if (game.players.length >= 2) {
      socket.emit("error", "This game is already full.");
      return;
    }
    if (game.players[0].id === playerId) {
      socket.emit("error", "You are already in this game.");
      return;
    }
    game.players.push({ socket, id: playerId, symbol: "O" });
    game.players[0].socket.emit("gameJoined", { pinCode, symbol: "X" });
    socket.emit("gameJoined", { pinCode, symbol: "O" });
  });

  socket.on("makeMove", ({ pinCode, index, player }) => {
    const game = games[pinCode];
    if (game && game.turn === player && !game.board[index]) {
      game.board[index] = player;
      game.turn = player === "X" ? "O" : "X";
      game.players.forEach((p) => p.socket.emit("updateBoard", game.board));
      if (checkWin(game.board, player)) {
        game.players.forEach((p) => p.socket.emit("gameOver", `${player} Wins!`));
      } else if (game.board.every((cell) => cell)) {
        game.players.forEach((p) => p.socket.emit("gameOver", "It's a Draw!"));
      }
    }
  });

  socket.on("chatMessage", ({ pinCode, message }) => {
    const game = games[pinCode];
    if (game) {
      game.players.forEach((p) => p.socket.emit("chat", message));
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

server.listen(3000, () => console.log("Server running on port 3000"));
