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
const hostGameBtn = document.getElementById("hostGameBtn");
const hostCode = document.getElementById("hostCode");
const offerInput = document.getElementById("offerInput");
const submitOfferBtn = document.getElementById("submitOfferBtn");
const answerInput = document.getElementById("answerInput");
const submitAnswerBtn = document.getElementById("submitAnswerBtn");
const multiplayerStatus = document.getElementById("multiplayerStatus");
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
let peerConnection = null;
let dataChannel = null;

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

// Mode Selection
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
  hostCode.textContent = "";
  multiplayerStatus.textContent = "";
  playerSymbol = null;
}

// WebRTC Setup
function setupWebRTC(isHost) {
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  if (isHost) {
    dataChannel = peerConnection.createDataChannel("gameChannel");
    setupDataChannel(dataChannel);
    createOffer();
  } else {
    peerConnection.ondatachannel = (event) => {
      dataChannel = event.channel;
      setupDataChannel(dataChannel);
    };
  }

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("ICE Candidate:", event.candidate);
    }
  };

  peerConnection.onconnectionstatechange = () => {
    console.log("Connection state:", peerConnection.connectionState);
    if (peerConnection.connectionState === "connected") {
      multiplayerStatus.textContent = "Grid Linked! Engage!";
      gameActive = true;
    }
  };
}

function setupDataChannel(channel) {
  channel.onopen = () => {
    multiplayerStatus.textContent = "Channel Open!";
    console.log("Data channel opened");
  };
  channel.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "move") {
      updateBoard(data.board);
      isXNext = !isXNext;
      statusDisplay.textContent = `${isXNext ? "X" : "O"} Activates...`;
      clickSound.play();
    } else if (data.type === "gameOver") {
      showWin(data.message);
      gameActive = false;
      winSound.play();
    }
  };
  channel.onclose = () => {
    multiplayerStatus.textContent = "Opponent Disconnected";
    gameActive = false;
  };
}

async function createOffer() {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  hostCode.textContent = `Share this offer: ${JSON.stringify(offer)}`;
  multiplayerStatus.textContent = "Awaiting Answer...";
}

async function handleOffer() {
  const offer = JSON.parse(offerInput.value);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  multiplayerStatus.textContent = `Share this answer: ${JSON.stringify(answer)}`;
}

async function handleAnswer() {
  const answer = JSON.parse(answerInput.value);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// Host Game
hostGameBtn.addEventListener("click", () => {
  playerSymbol = "X";
  setupWebRTC(true);
  isXNext = true;
  statusDisplay.textContent = "X Activates... (You: X)";
  clickSound.play();
});

// Submit Offer
submitOfferBtn.addEventListener("click", () => {
  playerSymbol = "O";
  setupWebRTC(false);
  handleOffer();
  isXNext = false;
  statusDisplay.textContent = "O Activates... (You: O)";
  clickSound.play();
});

// Submit Answer
submitAnswerBtn.addEventListener("click", () => {
  handleAnswer();
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
    const board = [...cells].map(cell => cell.textContent || null);
    board[index] = playerSymbol;
    cell.textContent = playerSymbol;
    cell.classList.add(playerSymbol);
    cell.style.color = playerSymbol === "X" ? colorX : colorO;
    clickSound.play();

    if (checkWin(playerSymbol)) {
      dataChannel.send(JSON.stringify({ type: "gameOver", message: `${playerSymbol} Dominates!` }));
      showWin(`${playerSymbol} Dominates!`);
      gameActive = false;
      winSound.play();
      return;
    }

    if (board.every(cell => cell)) {
      dataChannel.send(JSON.stringify({ type: "gameOver", message: "Gridlock!" }));
      showWin("Gridlock!");
      gameActive = false;
      return;
    }

    dataChannel.send(JSON.stringify({ type: "move", board }));
    isXNext = !isXNext;
    statusDisplay.textContent = `${isXNext ? "X" : "O"} Activates...`;
  } else {
    // Local/AI logic remains unchanged
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
      return;
    }

    isXNext = !isXNext;
    statusDisplay.textContent = `${isXNext ? "X" : "O"} Activates...`;
    if (isAIMode && !isXNext) setTimeout(makeAIMove, 500);
  }
}

// AI Move (unchanged)
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

// Get Best Move (unchanged)
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

// Minimax Algorithm (unchanged)
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

// Check Win
function checkWin(currentClass) {
  return winningCombinations.some(combination =>
    combination.every(index => cells[index].classList.contains(currentClass))
  );
}

// Show Win/Draw Overlay
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
  if (isOnlineMode && peerConnection) {
    peerConnection.close();
    peerConnection = null;
    dataChannel = null;
    hostCode.textContent = "";
    offerInput.value = "";
    answerInput.value = "";
    multiplayerStatus.textContent = "";
  }
  clickSound.play();
}

// Pause Game
pauseBtn.addEventListener("click", () => {
  if (!gameActive) return;
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
  statusDisplay.textContent = isPaused ? "System Paused" : `${isXNext ? "X" : "O"} Activates...`;
  clickSound.play();
});

// Quit Game
quitBtn.addEventListener("click", () => {
  if (confirm("Exit the Grid?")) window.close();
});

// Apply Colors
applyColorsBtn.addEventListener("click", () => {
  colorX = colorXInput.value;
  colorO = colorOInput.value;
  cells.forEach(cell => {
    if (cell.classList.contains("X")) cell.style.color = colorX;
    else if (cell.classList.contains("O")) cell.style.color = colorO;
  });
  clickSound.play();
});

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

// Cell Events
cells.forEach(cell => {
  cell.addEventListener("click", drawSymbol);
  cell.addEventListener("touchstart", (e) => {
    e.preventDefault();
    drawSymbol(e);
  }, { passive: false });
});

restartBtn.addEventListener("click", restartGame);
