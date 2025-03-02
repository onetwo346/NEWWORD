const cells = document.querySelectorAll("[data-cell]");
const statusDisplay = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");
const quitBtn = document.getElementById("quitBtn");
const colorXInput = document.getElementById("colorX");
const colorOInput = document.getElementById("colorO");
const applyColorsBtn = document.getElementById("applyColors");
const startBtn = document.getElementById("startBtn");
const descriptionPage = document.getElementById("descriptionPage");
const gamePage = document.getElementById("gamePage");
const modeToggle = document.getElementById("modeToggle");
const modeOptions = document.getElementById("modeOptions");
const difficultyOptions = document.getElementById("difficultyOptions");
const multiplayerSection = document.getElementById("multiplayerSection");
const generatePinBtn = document.getElementById("generatePinBtn");
const generatedCodeDisplay = document.getElementById("generatedCode");
const pinInput = document.getElementById("pinInput");
const joinBtn = document.getElementById("joinBtn");
const multiplayerStatus = document.getElementById("multiplayerStatus");
const chatSidebar = document.getElementById("chatSidebar");
const toggleChatBtn = document.getElementById("toggleChatBtn");
const chatContent = document.getElementById("chatContent");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChat");
const clickSound = document.getElementById("clickSound");
const winSound = document.getElementById("winSound");

let isXNext = true;
let gameActive = true;
let isPaused = false;
let colorX = colorXInput.value;
let colorO = colorOInput.value;
let isAIMode = false;
let isOnlineMode = false;
let aiDifficulty = "beginner";
let playerSymbol = null;
let currentPinCode = null;
let peer = null; // PeerJS instance
let conn = null; // PeerJS connection

const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// Start Game
startBtn.addEventListener("click", () => {
  descriptionPage.style.display = "none";
  gamePage.style.display = "block";
  toggleMultiplayerControls();
  clickSound.play();
});

// Radial Mode Selector
modeToggle.addEventListener("click", () => {
  modeOptions.classList.toggle("active");
  if (!isAIMode) difficultyOptions.classList.remove("active");
  clickSound.play();
});

modeOptions.querySelectorAll(".radial-option").forEach(option => {
  option.addEventListener("click", (e) => {
    const mode = e.target.dataset.mode;
    isAIMode = mode === "ai";
    isOnlineMode = mode === "online";
    toggleMultiplayerControls();
    if (isAIMode) difficultyOptions.classList.add("active");
    else difficultyOptions.classList.remove("active");
    modeOptions.classList.remove("active");
    restartGame();
    clickSound.play();
  });
});

difficultyOptions.querySelectorAll(".radial-option").forEach(option => {
  option.addEventListener("click", (e) => {
    aiDifficulty = e.target.dataset.difficulty;
    difficultyOptions.classList.remove("active");
    if (isAIMode) restartGame();
    clickSound.play();
  });
});

// Toggle Multiplayer Controls
function toggleMultiplayerControls() {
  multiplayerSection.style.display = isOnlineMode ? "block" : "none";
  chatSidebar.style.display = isOnlineMode ? "block" : "none";
  chatContent.classList.remove("active");
  generatedCodeDisplay.textContent = "";
  multiplayerStatus.textContent = "";
  currentPinCode = null;
  playerSymbol = null;
  if (peer) peer.destroy(); // Clean up old peer instance
  conn = null;
}

// Initialize PeerJS for Multiplayer
function initializePeer(isHost) {
  peer = new Peer(isHost ? undefined : currentPinCode, {
    host: 'peerjs-server.herokuapp.com', // Free PeerJS server
    secure: true,
    port: 443
  });

  peer.on('open', (id) => {
    currentPinCode = id; // Use PeerJS ID as the game code
    if (isHost) {
      generatedCodeDisplay.textContent = `Code: ${currentPinCode}`;
      multiplayerStatus.textContent = "Awaiting Challenger...";
    }
    console.log(`Peer ID: ${id}`);
  });

  peer.on('connection', (connection) => {
    conn = connection;
    setupConnection();
    if (isHost) {
      playerSymbol = 'X';
      multiplayerStatus.textContent = "Grid Linked! Engage!";
      statusDisplay.textContent = `${isXNext ? "X" : "O"} Activates... (You: X)`;
    }
  });

  peer.on('error', (err) => {
    multiplayerStatus.textContent = `Error: ${err.type}`;
    console.error(err);
  });
}

// Setup Peer Connection
function setupConnection() {
  conn.on('data', (data) => {
    if (data.type === 'move') {
      updateBoard(data.board);
      isXNext = !isXNext;
      statusDisplay.textContent = `${isXNext ? "X" : "O"} Activates...`;
      clickSound.play();
    } else if (data.type === 'chat') {
      const msgDiv = document.createElement("div");
      msgDiv.textContent = data.message;
      chatMessages.appendChild(msgDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } else if (data.type === 'gameOver') {
      showWin(data.message);
      gameActive = false;
      winSound.play();
    }
  });

  conn.on('close', () => {
    multiplayerStatus.textContent = "Challenger Lost. Reset to Retry.";
    gameActive = false;
    chatContent.classList.remove("active");
    toggleChatBtn.textContent = "Open Comm";
  });
}

// Generate Game Code (Host)
generatePinBtn.addEventListener("click", () => {
  initializePeer(true); // Host creates a game
  clickSound.play();
});

// Join Game (Client)
joinBtn.addEventListener("click", () => {
  const opponentPinCode = pinInput.value.trim().toUpperCase();
  if (!opponentPinCode) {
    statusDisplay.textContent = "Input a Code!";
    return;
  }
  currentPinCode = opponentPinCode;
  initializePeer(false); // Client joins a game
  conn = peer.connect(opponentPinCode);
  conn.on('open', () => {
    playerSymbol = 'O';
    multiplayerStatus.textContent = "Grid Linked! Engage!";
    statusDisplay.textContent = `${isXNext ? "X" : "O"} Activates... (You: O)`;
    chatContent.classList.add("active");
    toggleChatBtn.textContent = "Close Comm";
    setupConnection();
  });
  clickSound.play();
});

// Draw Symbol
function drawSymbol(event) {
  if (!gameActive || isPaused) return;
  const cell = event.target;
  const index = [...cells].indexOf(cell);
  if (cell.classList.contains("X") || cell.classList.contains("O")) return;

  if (isOnlineMode) {
    if (playerSymbol !== (isXNext ? "X" : "O")) return;
    const currentClass = playerSymbol;
    cell.classList.add(currentClass);
    cell.style.color = currentClass === "X" ? colorX : colorO;
    cell.textContent = currentClass;
    clickSound.play();

    const board = Array.from(cells).map(cell => cell.textContent || null);
    conn.send({ type: 'move', board });

    if (checkWin(currentClass)) {
      conn.send({ type: 'gameOver', message: `${currentClass} Dominates!` });
      showWin(`${currentClass} Dominates!`);
      gameActive = false;
      winSound.play();
      return;
    }

    if (board.every(cell => cell)) {
      conn.send({ type: 'gameOver', message: "Gridlock!" });
      showWin("Gridlock!");
      gameActive = false;
      setTimeout(restartGame, 2000);
      return;
    }
  } else {
    // Local/AI mode remains unchanged
    const currentClass = isXNext ? "X" : "O";
    cell.classList.add(currentClass);
    cell.style.color = isXNext ? colorX : colorO;
    cell.textContent = currentClass;
    clickSound.play();

    if (checkWin(currentClass)) {
      showWin(`${currentClass} Dominates!`);
      gameActive = false;
      winSound.play();
      return;
    }

    if ([...cells].every(cell => cell.classList.contains("X") || cell.classList.contains("O"))) {
      showWin("Gridlock!");
      gameActive = false;
      setTimeout(restartGame, 2000);
      return;
    }

    isXNext = !isXNext;
    statusDisplay.textContent = `${isXNext ? "X" : "O"} Activates...`;
    if (isAIMode && !isXNext) setTimeout(makeAIMove, 500);
  }
}

// Update Board
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
  if (message && isOnlineMode && conn) {
    const formattedMessage = `${playerSymbol}: ${message}`;
    conn.send({ type: 'chat', message: formattedMessage });
    const msgDiv = document.createElement("div");
    msgDiv.textContent = formattedMessage;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatInput.value = "";
    clickSound.play();
  }
});

// Restart Game
function restartGame() {
  isXNext = true;
  gameActive = true;
  isPaused = false;
  pauseBtn.textContent = "Pause";
  statusDisplay.textContent = "X Activates...";
  cells.forEach(cell => {
    cell.classList.remove("X", "O");
    cell.textContent = "";
    cell.style.color = "";
  });
  if (isOnlineMode && currentPinCode) {
    chatMessages.innerHTML = "";
    chatContent.classList.remove("active");
    generatedCodeDisplay.textContent = `Code: ${currentPinCode}`;
    pinInput.value = "";
    multiplayerStatus.textContent = "Awaiting Challenger...";
  } else {
    multiplayerStatus.textContent = "";
    generatedCodeDisplay.textContent = "";
  }
  clickSound.play();
}

// Remaining functions (AI, Minimax, etc.) remain unchanged
function makeAIMove() {
  if (!gameActive || isPaused) return;
  const emptyCells = [...cells].filter(cell => !cell.classList.contains("X") && !cell.classList.contains("O"));
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

function getBestMove(emptyCells, player, isPro = false) {
  if (isPro) {
    let bestMove, bestScore = -Infinity;
    emptyCells.forEach(cell => {
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
      ) return cells[c];
      if (
        cells[a].classList.contains("X") &&
        cells[b].classList.contains("X") &&
        !cells[c].classList.contains("O") &&
        emptyCells.includes(cells[c])
      ) return cells[c];
    }
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }
}

function minimax(cells, depth, isMaximizing) {
  if (checkWin("O")) return 10 - depth;
  if (checkWin("X")) return depth - 10;
  if ([...cells].every(cell => cell.classList.contains("X") || cell.classList.contains("O"))) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    cells.forEach(cell => {
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
    cells.forEach(cell => {
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

function checkWin(currentClass) {
  return winningCombinations.some(combination =>
    combination.every(index => cells[index].classList.contains(currentClass))
  );
}

function showWin(message) {
  const overlay = document.createElement("div");
  overlay.classList.add("win-overlay");
  const text = document.createElement("div");
  text.classList.add("win-text");
  text.textContent = message;
  overlay.appendChild(text);
  document.body.appendChild(overlay);
  overlay.classList.add("active");
  setTimeout(() => {
    overlay.remove();
  }, 2000);
}

pauseBtn.addEventListener("click", () => {
  if (!gameActive) return;
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
  statusDisplay.textContent = isPaused ? "System Paused" : `${isXNext ? "X" : "O"} Activates...`;
  clickSound.play();
});

quitBtn.addEventListener("click", () => {
  if (confirm("Exit the Grid?")) window.close();
});

applyColorsBtn.addEventListener("click", () => {
  colorX = colorXInput.value;
  colorO = colorOInput.value;
  cells.forEach(cell => {
    if (cell.classList.contains("X")) cell.style.color = colorX;
    else if (cell.classList.contains("O")) cell.style.color = colorO;
  });
  clickSound.play();
});

toggleChatBtn.addEventListener("click", () => {
  chatContent.classList.toggle("active");
  toggleChatBtn.textContent = chatContent.classList.contains("active") ? "Close Comm" : "Open Comm";
  clickSound.play();
});

cells.forEach(cell => {
  cell.addEventListener("click", drawSymbol);
  cell.addEventListener("touchstart", (e) => {
    e.preventDefault();
    drawSymbol(e);
  }, { passive: false });
});
restartBtn.addEventListener("click", restartGame);
