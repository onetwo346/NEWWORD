const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Update to your domain in production
    methods: ['GET', 'POST'],
  },
});

const games = {};

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('createGame', ({ pinCode, playerId }) => {
    if (games[pinCode]) {
      socket.emit('error', 'Code already in use. Try another.');
      console.log(`Duplicate code attempted: ${pinCode}`);
      return;
    }
    games[pinCode] = {
      players: [{ id: playerId, symbol: 'X' }],
      board: Array(9).fill(null),
    };
    socket.join(pinCode);
    socket.emit('gameCreated');
    console.log(`Game created: ${pinCode} by ${playerId}`);
  });

  socket.on('joinGame', ({ pinCode, playerId }) => {
    const game = games[pinCode];
    if (!game) {
      socket.emit('error', 'Invalid game code.');
      console.log(`Invalid code entered: ${pinCode} by ${playerId}`);
      return;
    }
    if (game.players.length >= 2) {
      socket.emit('error', 'Game is full.');
      console.log(`Game full: ${pinCode} attempted by ${playerId}`);
      return;
    }
    game.players.push({ id: playerId, symbol: 'O' });
    socket.join(pinCode);
    socket.emit('gameJoined', { pinCode, symbol: 'O' });
    io.to(game.players[0].id).emit('gameJoined', { pinCode, symbol: 'X' });
    console.log(`Player ${playerId} joined ${pinCode}`);
  });

  socket.on('makeMove', ({ pinCode, index, player }) => {
    const game = games[pinCode];
    if (!game || game.board[index]) return;
    game.board[index] = player;
    io.to(pinCode).emit('updateBoard', game.board);

    const winner = checkWin(game.board);
    if (winner) {
      io.to(pinCode).emit('gameOver', `${winner} Dominates!`);
      delete games[pinCode];
    } else if (game.board.every(cell => cell)) {
      io.to(pinCode).emit('gameOver', 'Gridlock!');
      delete games[pinCode];
    }
  });

  socket.on('chatMessage', ({ pinCode, message }) => {
    io.to(pinCode).emit('chat', message);
  });

  socket.on('disconnect', () => {
    for (const pinCode in games) {
      const game = games[pinCode];
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);
        io.to(pinCode).emit('opponentDisconnected');
        delete games[pinCode];
        console.log(`Player ${socket.id} disconnected from ${pinCode}`);
        break;
      }
    }
  });
});

function checkWin(board) {
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const combo of winningCombinations) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
