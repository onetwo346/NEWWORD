const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const games = {}; // Store active games by pin code

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("joinGame", (pinCode) => {
    if (!games[pinCode]) {
      games[pinCode] = { players: [socket], board: Array(9).fill(null), turn: "X" };
      socket.emit("status", "Waiting for opponent...");
    } else if (games[pinCode].players.length === 1) {
      games[pinCode].players.push(socket);
      games[pinCode].players[0].emit("gameStart", { board: games[pinCode].board, turn: "X", symbol: "X" });
      socket.emit("gameStart", { board: games[pinCode].board, turn: "X", symbol: "O" });
    } else {
      socket.emit("status", "Game is full!");
    }
  });

  socket.on("makeMove", ({ pinCode, index, player }) => {
    const game = games[pinCode];
    if (game && game.turn === player && !game.board[index]) {
      game.board[index] = player;
      game.turn = player === "X" ? "O" : "X";
      game.players.forEach((p) => p.emit("updateBoard", game.board));
      if (checkWin(game.board, player)) {
        game.players.forEach((p) => p.emit("gameOver", `${player} Wins!`));
      } else if (game.board.every((cell) => cell)) {
        game.players.forEach((p) => p.emit("gameOver", "Draw!"));
      }
    }
  });

  socket.on("chatMessage", ({ pinCode, message }) => {
    if (games[pinCode]) {
      games[pinCode].players.forEach((p) => p.emit("chat", message));
    }
  });

  socket.on("disconnect", () => {
    for (let pin in games) {
      games[pin].players = games[pin].players.filter((p) => p !== socket);
      if (games[pin].players.length === 0) {
        delete games[pin];
      } else {
        games[pin].players.forEach((p) => p.emit("status", "Opponent disconnected. Restart to play again."));
      }
    }
  });
});

function checkWin(board, player) {
  const wins = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
  return wins.some((combo) => combo.every((i) => board[i] === player));
}

server.listen(3000, () => console.log("Server running on port 3000"));
