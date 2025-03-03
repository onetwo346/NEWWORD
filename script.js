const cells = document.querySelectorAll("[data-cell]");
const statusDisplay = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const clearBtn = document.getElementById("clearBtn");
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
let peer = null;
let conn = null;
let board = Array(9).fill(null);
let moveQueue = [];
let lastSyncTime = 0;

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
  toggleChatBtn.textContent = "Open Comm";
  generatedCodeDisplay.textContent = "";
  multiplayerStatus.textContent = "";
  playerSymbol = null;
  if (peer) peer.destroy();
  conn = null;
  clearGrid();
}

// Generate Game Code
generatePinBtn.addEventListener("click", () => {
  if (peer) peer.destroy();
  peer = new Peer(generatePinCode(), {
    debug: 2,
    config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "turn:relay1.expressturn.com:3478", username: "user", credential: "pass" }] }
  });
  peer.on('open', (id) => {
    generatedCodeDisplay.textContent = `Your Code: ${id}`;
    multiplayerStatus.textContent = "Share this code or enter another to connect!";
    playerSymbol = null;
    gameActive = true;
  });
  peer.on('connection', (connection) => {
    conn = connection;
    playerSymbol = "X";
    isXNext = true;
    statusDisplay.textContent = "X Activates... (You: X)";
    setupConnection();
    multiplayerStatus.textContent = "Grid Linked! Engage!";
    chatContent.classList.add("active");
    toggleChatBtn.textContent = "Close Comm";
    syncBoard();
  });
  peer.on('error', (err) => {
    multiplayerStatus.textContent = `Error: ${err.type}. Retry generating code.`;
    console.error("PeerJS Error:", err);
  });
  clickSound.play();
});

function generatePinCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pin = "";
  for (let i = 0; i < 6; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

// Join Game
joinBtn.addEventListener("click", () => {
  const opponentCode = pinInput.value.trim().toUpperCase();
  if (!opponentCode) {
    statusDisplay.textContent = "Input a Code!";
    return;
  }
  if (!peer) {
    multiplayerStatus.textContent = "Generate your code first!";
    return;
  }
  conn = peer.connect(opponentCode, { reliable: true });
  playerSymbol = "O";
  isXNext = true;
  statusDisplay.textContent = "X Activates... (You: O)";
  gameActive = true;
  setupConnection();
  multiplayerStatus.textContent = "Linking...";
  clickSound.play();
});

// Setup PeerJS Connection
function setupConnection() {
  conn.on('open', () => {
    multiplayerStatus.textContent = "Grid Linked! Engage!";
    chatContent.classList.add("active");
    toggleChatBtn.textContent = "Close Comm";
    syncBoard();
    processMoveQueue();

    // Start a ping interval to keep the connection alive
    const pingInterval = setInterval(() => {
      if (conn && conn.open) {
        conn.send({ type: "ping" });
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // Ping every 30 seconds
  });

  conn.on('data', (data) => {
    if (!gameActive) return;
    if (data.type === "move") {
      board = data.board;
      updateBoard();
      isXNext = !isXNext;
      statusDisplay.textContent = `${isXNext ? "X" : "O"} Activates...`;
      clickSound.play();
      checkGameEnd();
    } else if (data.type === "chat") {
      displayChatMessage(data.message);
    } else if (data.type === "sync" || data.type === "clear") {
      board = data.board;
      updateBoard();
      isXNext = true;
      statusDisplay.textContent = "X Activates...";
    } else if (data.type === "gameOver") {
      showWin(data.message);
      gameActive = false;
      winSound.play();
    } else if (data.type === "ping") {
      // Respond to ping to keep connection alive
      if (conn && conn.open) {
        conn.send({ type: "pong" });
      }
    }
  });

  conn.on('close', () => {
    statusDisplay.textContent = "Challenger Lost. Reset to Retry.";
    gameActive = false;
    multiplayerStatus.textContent = "Disconnected. Generate or join again.";
    chatContent.classList.remove("active");
    toggleChatBtn.textContent = "Open Comm";

    // Attempt to reconnect
    if (isOnlineMode && peer) {
      setTimeout(() => {
        if (conn && !conn.open) {
          conn = peer.connect(conn.peer, { reliable: true });
          setupConnection();
        }
      }, 5000); // Attempt to reconnect after 5 seconds
    }
  });

  conn.on('error', (err) => {
    console.error("Connection Error:", err);
    multiplayerStatus.textContent = "Link Issue. Try again.";
  });
}

// Add visibility change event listener to handle app backgrounding
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === 'hidden' && isOnlineMode && conn && conn.open) {
    // Attempt to keep the connection alive
    conn.send({ type: "ping" });
  }
});

// Rest of your original code remains unchanged...
// (e.g., drawSymbol, makeAIMove, checkWin, showWin, clearGrid, etc.)

// Call attemptReconnect periodically if the connection is lost
setInterval(() => {
  if (isOnlineMode && peer && conn && !conn.open) {
    attemptReconnect();
  }
}, 10000); // Attempt to reconnect every 10 seconds
