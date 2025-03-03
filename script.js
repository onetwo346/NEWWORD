// Add visibility change event listener to handle app backgrounding
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === 'hidden' && isOnlineMode && conn && conn.open) {
    // Attempt to keep the connection alive
    conn.send({ type: "ping" });
  }
});

// Modify the setupConnection function to handle pings and reconnection attempts
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

// Modify the generatePinBtn event listener to include reconnection logic
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

// Add a function to handle reconnection attempts
function attemptReconnect() {
  if (isOnlineMode && peer && conn && !conn.open) {
    conn = peer.connect(conn.peer, { reliable: true });
    setupConnection();
  }
}

// Call attemptReconnect periodically if the connection is lost
setInterval(() => {
  if (isOnlineMode && peer && conn && !conn.open) {
    attemptReconnect();
  }
}, 10000); // Attempt to reconnect every 10 seconds
