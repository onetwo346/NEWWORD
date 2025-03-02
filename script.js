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

let peer = null;
let conn = null;

// Initialize PeerJS
function initializePeer() {
  peer = new Peer();
  peer.on('open', (id) => {
    console.log('My peer ID is: ' + id);
    generatedCodeDisplay.textContent = `Code: ${id}`;
    multiplayerStatus.textContent = "Awaiting Challenger...";
  });

  peer.on('connection', (connection) => {
    conn = connection;
    conn.on('data', handleData);
    multiplayerStatus.textContent = "Grid Linked! Engage!";
    gameActive = true;
    playerSymbol = 'O';
    statusDisplay.textContent = "X Activates... (You: O)";
  });

  peer.on('error', (err) => {
    console.error('PeerJS error:', err);
    multiplayerStatus.textContent = "Connection Error. Retry.";
  });
}

function handleData(data) {
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
}

// Generate Game Code
generatePinBtn.addEventListener("click", () => {
  initializePeer();
  clickSound.play();
});

// Join Game
joinBtn.addEventListener("click", () => {
  const opponentPinCode = pinInput.value.trim();
  if (!opponentPinCode) {
    statusDisplay.textContent = "Input a Code!";
    return;
  }
  conn = peer.connect(opponentPinCode);
  conn.on('open', () => {
    multiplayerStatus.textContent = "Grid Linked! Engage!";
    gameActive = true;
    playerSymbol = 'X';
    statusDisplay.textContent = "X Activates... (You: X)";
  });
  conn.on('data', handleData);
  conn.on('error', (err) => {
    console.error('Connection error:', err);
    multiplayerStatus.textContent = "Connection Error. Retry.";
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
    const currentClass = isXNext ? "X" : "O";
    cell.classList.add(currentClass);
    cell.style.color = isXNext ? colorX : colorO;
    cell.textContent = currentClass;
    clickSound.play();

    const board = Array.from(cells).map(cell => cell.textContent);
    conn.send({ type: 'move', board });

    if (checkWin(currentClass)) {
      showWin(`${currentClass} Dominates!`);
      gameActive = false;
      winSound.play();
      conn.send({ type: 'gameOver', message: `${currentClass} Dominates!` });
      return;
    }

    if ([...cells].every(cell => cell.classList.contains("X") || cell.classList.contains("O"))) {
      showWin("Gridlock!");
      gameActive = false;
      conn.send({ type: 'gameOver', message: "Gridlock!" });
      setTimeout(restartGame, 2000);
      return;
    }

    isXNext = !isXNext;
    statusDisplay.textContent = `${isXNext ? "X" : "O"} Activates...`;
  } else {
    // Local or AI mode logic remains the same
  }
}

// Rest of the code remains the same
