// DOM Elements
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
const generatedCodeDisplay = document.getElementById("generatedCode");
const multiplayerStatus = document.getElementById("multiplayerStatus");
const chatSidebar = document.getElementById("chatSidebar");
const toggleChatBtn = document.getElementById("toggleChatBtn");
const chatContent = document.getElementById("chatContent");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChat");
const clickSound = document.getElementById("clickSound");
const winSound = document.getElementById("winSound");
const joinSound = document.getElementById("joinSound");
const messageSound = document.getElementById("messageSound");
const contactsList = document.getElementById("contactsList");
const addFriendInput = document.getElementById("addFriendInput");
const addFriendBtn = document.getElementById("addFriendBtn");
const lobbyList = document.getElementById("lobbyList");
const friendRequestsList = document.getElementById("friendRequestsList");
const matchHistoryList = document.getElementById("matchHistoryList");

// Game State
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
let userCode = localStorage.getItem("userCode") || null;
let userIP = localStorage.getItem("userIP") || null;
let contacts = JSON.parse(localStorage.getItem("contacts")) || [];
let matchHistory = JSON.parse(localStorage.getItem("matchHistory")) || [];
let friendRequests = JSON.parse(localStorage.getItem("friendRequests")) || [];
let lobby = JSON.parse(localStorage.getItem("lobby")) || [];
let currentOpponentCode = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 3;

const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// Fetch IP Address and Generate Code
async function fetchIPAndGenerateCode() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    const ip = data.ip;

    // If IP has changed, regenerate the code
    if (ip !== userIP) {
      userIP = ip;
      localStorage.setItem("userIP", userIP);
      userCode = hashIPToCode(userIP);
      localStorage.setItem("userCode", userCode);
      multiplayerStatus.textContent = "IP detected. New code generated.";
    }
  } catch (error) {
    console.error("Error fetching IP:", error);
    multiplayerStatus.textContent = "Failed to detect IP. Using default code.";
    userCode = "DEFAULT" + Math.random().toString(36).substr(2, 8).toUpperCase();
    localStorage.setItem("userCode", userCode);
  }
  return userCode;
}

// Hash IP to Generate Code
function hashIPToCode(ip) {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.abs(hash + i) % chars.length);
  }
  return code;
}

// Save and Load Game State
function saveGameState() {
  const gameState = {
    board: [...board],
    isXNext,
    playerSymbol,
    userCode,
    userIP,
    contacts,
    matchHistory,
    friendRequests,
    lobby,
    currentOpponentCode
  };
  localStorage.setItem("ticTacToeState", JSON.stringify(gameState));
}

function loadGameState() {
  const savedState = localStorage.getItem("ticTacToeState");
  if (savedState) {
    const { board: savedBoard, isXNext: savedIsXNext, playerSymbol: savedSymbol, userCode: savedCode, userIP: savedIP, contacts: savedContacts, matchHistory: savedHistory, friendRequests: savedRequests, lobby: savedLobby, currentOpponentCode: savedOpponent } = JSON.parse(savedState);
    board = savedBoard;
    isXNext = savedIsXNext;
    playerSymbol = savedSymbol;
    userCode = savedCode;
    userIP = savedIP;
    contacts = savedContacts || [];
    matchHistory = savedHistory || [];
    friendRequests = savedRequests || [];
    lobby = savedLobby || [];
    currentOpponentCode = savedOpponent;
    generatedCodeDisplay.textContent = `Your Code: ${userCode}`;
    updateBoard();
    updateContactsList();
    updateMatchHistory();
    updateFriendRequests();
    if (isOnlineMode) {
      updateLobby();
      if (peer && !conn && currentOpponentCode) {
        multiplayerStatus.textContent = "Reconnecting to opponent...";
        attemptReconnection();
      }
    }
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (isOnlineMode && conn && conn.open) {
      conn.send({ type: "player-left" });
      isPaused = true;
      statusDisplay.textContent = "Game Paused";
    }
    saveGameState();
  } else {
    loadGameState();
    if (isOnlineMode) {
      fetchIPAndGenerateCode().then(() => {
        if (!peer) {
          peer = new Peer(userCode​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​
