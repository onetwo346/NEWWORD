const cells = document.querySelectorAll("[data-cell]");
const statusDisplay = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const quitBtn = document.getElementById("quitBtn");
const colorXInput = document.getElementById("colorX");
const colorOInput = document.getElementById("colorO");
const applyColorsBtn = document.getElementById("applyColors");
const startBtn = document.getElementById("startBtn");
const descriptionPage = document.getElementById("descriptionPage");
const gamePage = document.getElementById("gamePage");
const modeSelect = document.getElementById("modeSelect");
const difficultySelect = document.getElementById("difficultySelect");
const multiplayerControls = document.getElementById("multiplayerControls");
const generatePinBtn = document.getElementById("generatePinBtn");
const pinInput = document.getElementById("pinInput");
const joinBtn = document.getElementById("joinBtn");
const chatBox = document.getElementById("chatBox");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChat");

let isXNext = true;
let gameActive = true;
let colorX = colorXInput.value;
let colorO = colorOInput.value;
let isAIMode = false;
let isOnlineMode = false;
let aiDifficulty = "beginner";
let playerSymbol = null;
let currentPinCode = null;

const socket = io("http://localhost:3000"); // Replace with your server URL later

const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

// Start Game
startBtn.addEventListener("click", () => {
  descriptionPage.style.display = "none";
  gamePage.style.display = "block";
  toggleMultiplayerControls();
});

// Mode Selector
modeSelect.addEventListener("change", (e) => {
  isAIMode = e.target.value === "ai";
  isOnlineMode = e.target.value === "online";
  toggleMultiplayerControls();
  restartGame();
});

// Difficulty Selector
difficultySelect.addEventListener("change", (e) => {
  aiDifficulty = e.target.value;
  if (isAIMode) restartGame();
});

// Toggle Multiplayer Controls
function toggleMultiplayerControls() {
  multiplayerControls.style.display = isOnlineMode ? "block" : "none";
  chatBox.style.display = isOnlineMode ? "block" : "none";
}

// Generate Pin Code
generatePinBtn.addEventListener("click", () => {
  currentPinCode = generatePinCode();
  socket.emit("joinGame", currentPinCode);
  statusDisplay.innerText = `Your Pin Code: ${currentPinCode}. Share it with a friend!`;
});

function generatePinCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pin = "";
  for (let i = 0; i < 6; i++) { // Fixed loop condition
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

// Join Game
joinBtn.addEventListener("click", () => {
  currentPinCode = pinInput.value.trim();
  if (currentPinCode) {
    socket.emit("joinGame", currentPinCode);
    statusDisplay.innerText = "Attempting to join game...";
  }
});

// Draw Symbol
function drawSymbol(event) {
  if (!gameActive) return;
  const cell = event.target;
  const index = [...cells].indexOf(cell);
  if (cell.classList.contains("X") || cell.classList.contains("O")) return;

  if (isOnlineMode) {
    if (playerSymbol !== (isXNext ? "X" : "O")) return; // Only allow player's turn
    socket.emit("makeMove", { pinCode: currentPinCode, index, player: playerSymbol });
  } else {
    const currentClass = isXNext ? "X" : "O";
    cell.classList.add(currentClass);
    cell.style.color = isXNext ? colorX : colorO;
    cell.textContent = currentClass;

    if (checkWin(currentClass)) {
      statusDisplay.innerText = `${currentClass} Wins!`;
      gameActive = false;
      showBalloons();
      return;
    }

    if ([...cells].every((cell) => cell.classList.contains("X") || cell.classList.contains("O"))) {
      statusDisplay.innerText = "Draw!";
      gameActive = false;
      setTimeout(restartGame, 2000);
      return;
    }

    isXNext = !isXNext;
    statusDisplay.innerText = `Player ${isXNext ? "X" : "O"}'s turn`;

    if (isAIMode && !isXNext) {
      setTimeout(makeAIMove, 500);
    }
  }
}

// AI Move
function makeAIMove() {
  const emptyCells = [...cells].filter((cell) => !cell.classList.contains("X") && !cell.classList.contains("O"));
  if (emptyCells.length > 0) {
    let chosenCell;
    if (aiDifficulty === "beginner") {
      chosenCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    } else if (aiDifficulty === "amateur") {
      chosenCell = getBestMove(emptyCells, "O");
    } else if (aiDifficulty === "pro") {
      chosenCell = getBestMove(emptyCells, "O", true);
    }
    chosenCell.click();
  }
}

// Get Best Move
function getBestMove(emptyCells, player, isPro = false) {
  if (isPro) {
    let bestMove;
    let bestScore = -Infinity;
    emptyCells.forEach((cell) => {
      cell.classList.add(player);
      const score = minimax(cells, 0, false);
      cell.classList.remove(player);
      if (score > bestScore) {
        bestScore = score;
        bestMove = cell;
      }
    });
    return bestMove;
  } else {
    for (let combination of winningCombinations) {
      const [a, b, c] = combination;
      if (
        cells[a].classList.contains("O") &&
        cells[b].classList.contains("O") &&
        !cells[c].classList.contains("X") &&
        emptyCells.includes(cells[c])
      ) {
        return cells[c];
      }
      if (
        cells[a].classList.contains("X") &&
        cells[b].classList.contains("X") &&
        !cells[c].classList.contains("O") &&
        emptyCells.includes(cells[c])
      ) {
        return cells[c];
      }
    }
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }
}

// Minimax Algorithm
function minimax(cells, depth, isMaximizing) {
  if (checkWin("O")) return 10 - depth;
  if (checkWin("X")) return depth - 10;
  if ([...cells].every((cell) => cell.classList.contains("X") || cell.classList.contains("O"))) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    cells.forEach((cell) => {
      if (!cell.classList.contains("X") && !cell.classList.contains("O")) {
        cell.classList.add("O");
        const score = minimax(cells, depth + 1, false);
        cell.classList.remove("O");
        bestScore = Math.max(score, bestScore);
      }
    });
    return bestScore;
  } else {
    let bestScore = Infinity;
    cells.forEach((cell) => {
      if (!cell.classList.contains("X") && !cell.classList.contains("O")) {
        cell.classList.add("X");
        const score = minimax(cells, depth + 1, true);
        cell.classList.remove("X");
        bestScore = Math.min(score, bestScore);
      }
    });
    return bestScore;
  }
}

// Check Win
function checkWin(currentClass) {
  return winningCombinations.some((combination) => {
    return combination.every((index) => {
      return cells[index].classList.contains(currentClass);
    });
  });
}

// Restart Game
function restartGame() {
  isXNext = true;
  gameActive = true;
  playerSymbol = null;
  statusDisplay.innerText = `Player X's turn`;
  cells.forEach((cell) => {
    cell.classList.remove("X", "O");
    cell.textContent = "";
    cell.style.color = "";
  });
  removeBalloons();
  if (isOnlineMode && currentPinCode) {
    chatMessages.innerHTML = "";
    socket.emit("joinGame", currentPinCode); // Rejoin same game
  }
}

// Quit Game
quitBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to quit?")) {
    window.close();
  }
});

// Apply Colors
applyColorsBtn.addEventListener("click", () => {
  colorX = colorXInput.value;
  colorO = colorOInput.value;
  cells.forEach((cell) => {
    if (cell.classList.contains("X")) {
      cell.style.color = colorX;
    } else if (cell.classList.contains("O")) {
      cell.style.color = colorO;
    }
  });
});

// Balloons Animation
function showBalloons() {
  const balloonContainer = document.createElement("div");
  balloonContainer.classList.add("balloon-container");
  for (let i = 0; i < 5; i++) {
    const balloon = document.createElement("div");
    balloon.classList.add("balloon");
    balloonContainer.appendChild(balloon);
  }
  document.body.appendChild(balloonContainer);
}

function removeBalloons() {
  const balloonContainer = document.querySelector(".balloon-container");
  if (balloonContainer) {
    balloonContainer.remove();
  }
}

// Socket.IO Events
socket.on("status", (message) => {
  statusDisplay.innerText = message;
});

socket.on("gameStart", ({ board, turn, symbol }) => {
  gameActive = true;
  playerSymbol = symbol;
  isXNext = turn === "X";
  updateBoard(board);
  statusDisplay.innerText = `Player ${turn}'s turn (You are ${symbol})`;
});

socket.on("updateBoard", (board) => {
  updateBoard(board);
  isXNext = !isXNext;
  statusDisplay.innerText = `Player ${isXNext ? "X" : "O"}'s turn`;
});

socket.on("gameOver", (message) => {
  statusDisplay.innerText = message;
  gameActive = false;
  showBalloons();
});

function updateBoard(board) {
  cells.forEach((cell, index) => {
    cell.textContent = board[index] || "";
    cell.classList.remove("X", "O");
    if (board[index]) {
      cell.classList.add(board[index]);
      cell.style.color = board[index] === "X" ? colorX : colorO;
    }
  });
}

// Chat
sendChatBtn.addEventListener("click", () => {
  const message = chatInput.value;
  if (message && isOnlineMode) {
    socket.emit("chatMessage", { pinCode: currentPinCode, message: `${playerSymbol}: ${message}` });
    chatInput.value = "";
  }
});

socket.on("chat", (message) => {
  const msgDiv = document.createElement("div");
  msgDiv.textContent = message;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Event Listeners
cells.forEach((cell) => cell.addEventListener("click", drawSymbol));
restartBtn.addEventListener("click", restartGame);
