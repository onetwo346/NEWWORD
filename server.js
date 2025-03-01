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

const players = {}; // Store player codes and sockets
const games = {}; // Store active games by pin code

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("registerCode", ({ pinCode, playerId }) => {
    if (players[pinCode] && players[pinCode].playerId !== playerId) {
      socket.emit("error", "This game code is already in use. Try a different one.");
      return;
    }
    players[pinCode] = { socket, playerId };
    socket.emit("codeRegistered");
  });

  socket.on("joinGame", ({ myPinCode, opponentPinCode, playerId }) => {
    if (!players[myPinCode] || players[myPinCode].playerId !== playerId) {
      socket.emit("error", "Your game code is not registered. Generate a new code.");
      return;
    }
    if (!players[opponentPinCode]) {
      socket.emit("error", "Friend's game code not found. Please check the code.");
      return;
    }
    if (opponentPinCode === myPinCode) {
      socket.emit("error", "You cannot join your own game!");
      return;
    }

    const player1 = players[myPinCode];
    const player2 = players[opponentPinCode];

    const gameId = `${myPinCode}-${opponentPinCode}`;
    if (games[gameId]) {
      socket.emit("error", "This game is already in progress.");
      return;
    }

    games[gameId] = {
      players: [
        { socket: player1.socket, id: player1.playerId, pinCode: myPinCode, symbol: "X" },
        { socket: player2.socket, id: player2.playerId, pinCode: opponentPinCode, symbol: "O" },
      ],
      board: Array(9).fill(null),
      turn: "X",
    };

    games[gameId].players.forEach((p) => {
      p.socket.emit("gameStart", {
        board: games[gameId].board,
        turn: "X",
        symbol: p.symbol,
      });
    });
  });

  socket.on("makeMove", ({ pinCode, index, player }) => {
    const game = Object.values(games).find(
      (g) => g.players.some((p) => p.pinCode === pinCode && p.symbol === player)
    );
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
    const game = Object.values(games).find((g) => g.players.some((p) => p.pinCode === pinCode));
    if (game) {
      game.players.forEach((p) => p.socket.emit("chat", message));
    }
  });

  socket.on("disconnect", () => {
    for (let pin in players) {
      if (players[pin].socket === socket) {
        delete players[pin];
        break;
      }
    }
    for (let gameId in games) {
      const game = games[gameId];
      const playerIndex = game.players.findIndex((p) => p.socket === socket);
      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);
        if (game.players.length === 0) {
          delete games[gameId];
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
