// Existing DOM elements (unchanged, just referencing key ones)
const cells = document.querySelectorAll("[data-cell]");
const statusDisplay = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const chatSidebar = document.getElementById("chatSidebar"); // Now our enhanced sidebar
const toggleChatBtn = document.getElementById("toggleChatBtn");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChat");

// New DOM elements for sidebar features
const sidebarContent = document.getElementById("sidebarContent");
const moveHistoryList = document.getElementById("moveHistory");
const playerStats = document.getElementById("playerStats");
const tauntBtn = document.getElementById("tauntBtn");
const soundToggle = document.getElementById("soundToggle");

// Game state (adding new variables)
let isXNext = true;
let gameActive = true;
let isOnlineMode = false;
let playerSymbol = null;
let conn = null;
let board = Array(9).fill(null);
let moveHistory = []; // Track moves for the sidebar
let playerData = { wins: 0, losses: 0, draws: 0 }; // Mock player stats

// Existing event listeners (unchanged for brevity, just focusing on new stuff)

// Toggle Sidebar (replacing old chat toggle)
toggleChatBtn.addEventListener("click", () => {
  chatSidebar.classList.toggle("active");
  toggleChatBtn.textContent = chatSidebar.classList.contains("active") ? "Collapse GridComm" : "Expand GridComm";
  clickSound.play();
});

// Enhanced Chat with Timestamps
function sendChatMessage() {
  const message = chatInput.value.trim();
  if (message && isOnlineMode && conn && conn.open) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullMessage = `[${timestamp}] ${playerSymbol}: ${message}`;
    conn.send({ type: "chat", message: fullMessage });
    displayChatMessage(fullMessage);
    chatInput.value = "";
    clickSound.play();
  }
}

function displayChatMessage(message) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("chat-message");
  msgDiv.textContent = message;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Move History
function logMove(index, symbol) {
  const move = `${symbol} placed at position ${index + 1}`;
  moveHistory.push(move);
  updateMoveHistory();
}

function updateMoveHistory() {
  moveHistoryList.innerHTML = "";
  moveHistory.forEach((move, idx) => {
    const li = document.createElement("li");
    li.textContent = `Move ${idx + 1}: ${move}`;
    moveHistoryList.appendChild(li);
  });
}

// Player Stats
function updatePlayerStats(result) {
  if (result === "win") playerData.wins++;
  else if (result === "loss") playerData.losses++;
  else if (result === "draw") playerData.draws++;
  playerStats.innerHTML = `
    <p>Wins: ${playerData.wins}</p>
    <p>Losses: ${playerData.losses}</p>
    <p>Draws: ${playerData.draws}</p>
  `;
}

// Taunt System
tauntBtn.addEventListener("click", () => {
  if (isOnlineMode && conn && conn.open) {
    const taunts = ["Prepare to lose!", "Gridmaster incoming!", "You can't stop me!"];
    const randomTaunt = taunts[Math.floor(Math.random() * taunts.length)];
    conn.send({ type: "chat", message: `${playerSymbol}: ${randomTaunt}` });
    displayChatMessage(`${playerSymbol}: ${randomTaunt}`);
    clickSound.play();
  }
});

// Sound Toggle
soundToggle.addEventListener("change", (e) => {
  clickSound.muted = !e.target.checked;
  winSound.muted = !e.target.checked;
});

// Updated drawSymbol for Online Mode
function drawSymbol(event) {
  if (!gameActive || !isOnlineMode || !playerSymbol || playerSymbol !== (isXNext ? "X" : "O")) return;
  const cell = event.target;
  const index = [...cells].indexOf(cell);
  if (board[index]) return;

  board[index] = playerSymbol;
  logMove(index, playerSymbol); // Log the move
  updateBoard();
  clickSound.play();

  if (conn && conn.open) {
    conn.send({ type: "move", board });
  }
  checkGameEnd();
  isXNext = !isXNext;
  statusDisplay.textContent = `${isXNext ? "X" : "O"} Activates...`;
}

// Updated checkGameEnd with Stats
function checkGameEnd() {
  const currentSymbol = playerSymbol;
  if (checkWin(currentSymbol)) {
    conn.send({ type: "gameOver", message: `${currentSymbol} Dominates!` });
    showWin(`${currentSymbol} Dominates!`);
    updatePlayerStats("win");
    gameActive = false;
    winSound.play();
  } else if (board.every(cell => cell)) {
    conn.send({ type: "gameOver", message: "Gridlock!" });
    showWin("Gridlock!");
    updatePlayerStats("draw");
    gameActive = false;
    setTimeout(clearGrid, 2000);
  }
}

// Enhanced Restart Game
function restartGame() {
  isXNext = true;
  gameActive = true;
  statusDisplay.textContent = "X Activates...";
  board = Array(9).fill(null);
  moveHistory = []; // Reset move history
  updateMoveHistory();
  updateBoard();
  if (isOnlineMode && conn && conn.open) {
    conn.send({ type: "sync", board });
    chatMessages.innerHTML = ""; // Clear chat
  }
  clickSound.play();
}

// Initialize Sidebar
function initializeSidebar() {
  chatSidebar.classList.add("sidebar");
  sidebarContent.innerHTML = `
    <div class="sidebar-section">
      <h3>GridComm</h3>
      <div id="chatMessages" class="chat-messages"></div>
      <input id="chatInput" type="text" placeholder="Transmit...">
      <button id="sendChat">Send</button>
    </div>
    <div class="sidebar-section">
      <h3>Move Log</h3>
      <ul id="moveHistory"></ul>
    </div>
    <div class="sidebar-section">
      <h3>Player Data</h3>
      <div id="playerStats"></div>
    </div>
    <div class="sidebar-section">
      <h3>Actions</h3>
      <button id="tauntBtn">Taunt</button>
      <label><input type="checkbox" id="soundToggle" checked> Sound</label>
    </div>
  `;
  // Re-bind new elements
  document.getElementById("sendChat").addEventListener("click", sendChatMessage);
  document.getElementById("chatInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });
}
