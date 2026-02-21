// Game state
let board = Array(9).fill(null);
let boardHistory = [];
let currentPlayer = 'X';
let gameOver = false;
let vsAI = false;
let aiDifficulty = 'medium';
let gameStarted = false;
let gameStartTime = null;
let timerInterval = null;
let soundEnabled = true;
let lastWinner = null;

// Stats and streaks
let stats = {
  X: 0,
  O: 0,
  draws: 0,
  xWinStreak: 0,
  oWinStreak: 0
};

// DOM elements
const cells = document.querySelectorAll('.cell');
const message = document.getElementById('message');
const playerTurn = document.getElementById('playerTurn');
const xWinsEl = document.getElementById('xWins');
const oWinsEl = document.getElementById('oWins');
const drawsEl = document.getElementById('draws');
const modeSelection = document.querySelector('.mode-selection');
const gameStatus = document.getElementById('gameStatus');
const gameButtonsSection = document.getElementById('gameButtonsSection');
const difficultySection = document.getElementById('difficultySection');
const board_el = document.getElementById('board');
const timerEl = document.getElementById('timer');
const moveCounterEl = document.getElementById('moveCounter');
const xStreakEl = document.getElementById('xStreak');
const oStreakEl = document.getElementById('oStreak');
const xStreakNumEl = document.getElementById('xStreakNum');
const oStreakNumEl = document.getElementById('oStreakNum');
const darkModeBtn = document.getElementById('darkModeBtn');
const soundBtn = document.getElementById('soundBtn');
const undoBtn = document.getElementById('undoBtn');
const confettiContainer = document.getElementById('confetti-container');

// Winning combinations
const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// Initialize event listeners
cells.forEach(cell => {
  cell.addEventListener('click', handleCellClick);
});

// Keyboard support (1-9)
document.addEventListener('keydown', (e) => {
  if (gameStarted && !gameOver && (!vsAI || (vsAI && currentPlayer === 'X'))) {
    const key = parseInt(e.key);
    if (key >= 1 && key <= 9) {
      const index = key - 1;
      handleClick(index);
    }
  }
});

// Dark mode toggle
darkModeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

// Sound toggle
soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundBtn.style.opacity = soundEnabled ? '1' : '0.5';
});

// Undo button
undoBtn.addEventListener('click', undoLastMove);

function handleCellClick(e) {
  const index = e.target.dataset.index;
  handleClick(index);
}

// Handle player move
function handleClick(index) {
  if (board[index] || gameOver) return;

  // Save to history for undo
  boardHistory.push([...board]);

  board[index] = currentPlayer;
  updateUI(index, currentPlayer);
  playSound('move');

  const winningLine = checkWin();
  if (winningLine) {
    endGame(currentPlayer, winningLine);
    return;
  }

  if (board.every(cell => cell !== null)) {
    endGame(null);
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updatePlayerTurn();
  updateMoveCounter();

  if (vsAI && currentPlayer === 'O') {
    setTimeout(makeAIMove, 600);
  }
}

// Update UI
function updateUI(index, player) {
  cells[index].textContent = player;
  cells[index].classList.add('played');
}

// Update player turn display
function updatePlayerTurn() {
  if (!gameOver) {
    const playerName = currentPlayer === 'X' ? 'You' : vsAI ? 'AI' : 'Player O';
    playerTurn.textContent = `Current Turn: ${currentPlayer} (${playerName})`;
  }
}

// Check win
function checkWin() {
  for (let [a, b, c] of winningLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c];
    }
  }
  return null;
}

// End game
function endGame(winner, winningLine) {
  gameOver = true;
  stopTimer();

  if (winner) {
    stats[winner]++;
    lastWinner = winner;
    
    // Update streaks
    if (winner === 'X') {
      stats.xWinStreak++;
      stats.oWinStreak = 0;
    } else {
      stats.oWinStreak++;
      stats.xWinStreak = 0;
    }
    
    message.textContent = `🎉 Player ${winner} wins!`;
    highlightCells(winningLine);
    playSound('win');
    createConfetti();
  } else {
    stats.draws++;
    lastWinner = null;
    message.textContent = "🤝 It's a draw!";
    playSound('draw');
  }

  renderStats();
  showGameButtons();
}

// Highlight winning cells
function highlightCells(line) {
  line.forEach(index => {
    cells[index].classList.add('winning-cell');
  });
}

// ============================================
// AI LOGIC
// ============================================

function makeAIMove() {
  if (aiDifficulty === 'easy') {
    aiMoveEasy();
  } else if (aiDifficulty === 'medium') {
    aiMoveMedium();
  } else if (aiDifficulty === 'hard') {
    aiMoveHard();
  }
}

// Easy: Random move
function aiMoveEasy() {
  const emptyCells = getEmptyCells();
  if (emptyCells.length === 0) return;

  const choice = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  handleClick(choice);
}

// Medium: Random with some strategy
function aiMoveMedium() {
  const emptyCells = getEmptyCells();
  if (emptyCells.length === 0) return;

  // 70% chance to make strategic move, 30% random
  if (Math.random() < 0.7) {
    // Try to win
    let winningMove = findWinningMove('O');
    if (winningMove !== -1) {
      handleClick(winningMove);
      return;
    }

    // Block opponent
    let blockingMove = findWinningMove('X');
    if (blockingMove !== -1) {
      handleClick(blockingMove);
      return;
    }

    // Take center if available
    if (board[4] === null) {
      handleClick(4);
      return;
    }

    // Take a corner
    const corners = [0, 2, 6, 8].filter(i => board[i] === null);
    if (corners.length > 0) {
      handleClick(corners[Math.floor(Math.random() * corners.length)]);
      return;
    }
  }

  // Random move
  const choice = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  handleClick(choice);
}

// Hard: Minimax algorithm (unbeatable)
function aiMoveHard() {
  let bestScore = -Infinity;
  let bestMove = -1;

  const emptyCells = getEmptyCells();

  for (let index of emptyCells) {
    board[index] = 'O';
    let score = minimax(board, 0, false);
    board[index] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  }

  if (bestMove !== -1) {
    handleClick(bestMove);
  }
}

// Minimax algorithm
function minimax(board, depth, isMaximizing) {
  const winningLine = checkWinHelper(board);

  if (winningLine && board[winningLine[0]] === 'O') {
    return 10 - depth;
  }
  if (winningLine && board[winningLine[0]] === 'X') {
    return depth - 10;
  }
  if (board.every(cell => cell !== null)) {
    return 0;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        let score = minimax(board, depth + 1, false);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'X';
        let score = minimax(board, depth + 1, true);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

// Helper function for minimax
function checkWinHelper(boardState) {
  for (let [a, b, c] of winningLines) {
    if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
      return [a, b, c];
    }
  }
  return null;
}

// Find winning move for specified player
function findWinningMove(player) {
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = player;
      const hasWin = checkWinHelper(board);
      board[i] = null;

      if (hasWin && board[hasWin[0]] === player) {
        return i;
      }
    }
  }
  return -1;
}

// Get empty cells
function getEmptyCells() {
  return board
    .map((val, idx) => val === null ? idx : null)
    .filter(val => val !== null);
}

// ============================================
// GAME CONTROLS
// ============================================

// Rematch (keep stats)
function rematchGame() {
  board = Array(9).fill(null);
  boardHistory = [];
  gameOver = false;
  currentPlayer = 'X';
  message.textContent = '';
  playerTurn.textContent = '';
  cells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('winning-cell', 'played');
  });
  gameButtonsSection.style.display = 'none';
  gameStatus.style.display = 'none';
  modeSelection.style.display = 'block';
  difficultySection.style.display = 'none';
  gameStarted = false;
  updateMoveCounter();
  startTimer();
}

// Reset (clear everything)
function resetGame() {
  rematchGame();
  stats = { X: 0, O: 0, draws: 0, xWinStreak: 0, oWinStreak: 0 };
  renderStats();
}

// Render stats
function renderStats() {
  xWinsEl.textContent = stats.X;
  oWinsEl.textContent = stats.O;
  drawsEl.textContent = stats.draws;
  
  // Update streaks
  if (stats.xWinStreak > 0) {
    xStreakEl.style.display = 'inline';
    xStreakNumEl.textContent = stats.xWinStreak;
  } else {
    xStreakEl.style.display = 'none';
  }
  
  if (stats.oWinStreak > 0) {
    oStreakEl.style.display = 'inline';
    oStreakNumEl.textContent = stats.oWinStreak;
  } else {
    oStreakEl.style.display = 'none';
  }
}

// Show game buttons
function showGameButtons() {
  gameButtonsSection.style.display = 'flex';
}

// Start game with AI
function startAIGame() {
  vsAI = true;
  gameStarted = true;
  modeSelection.style.display = 'none';
  difficultySection.style.display = 'block';
  gameStatus.style.display = 'block';
  message.textContent = 'Select AI Difficulty';
  updatePlayerTurn();
}

// Start two player game
function startTwoPlayerGame() {
  vsAI = false;
  gameStarted = true;
  modeSelection.style.display = 'none';
  difficultySection.style.display = 'none';
  gameStatus.style.display = 'block';
  board = Array(9).fill(null);
  boardHistory = [];
  gameOver = false;
  currentPlayer = 'X';
  cells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('winning-cell', 'played');
  });
  message.textContent = 'Two Player Mode - Let\'s Play!';
  updatePlayerTurn();
  updateMoveCounter();
  startTimer();
}

// Select difficulty
function selectDifficulty(difficulty) {
  aiDifficulty = difficulty;
  difficultySection.style.display = 'none';
  board = Array(9).fill(null);
  boardHistory = [];
  gameOver = false;
  currentPlayer = 'X';
  cells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('winning-cell', 'played');
  });
  message.textContent = `Playing vs AI (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`;
  updatePlayerTurn();
  updateMoveCounter();
  startTimer();
}

// ============================================
// EVENT LISTENERS
// ============================================

document.getElementById('twoPlayerBtn').addEventListener('click', startTwoPlayerGame);

document.getElementById('aiBtn').addEventListener('click', startAIGame);

document.getElementById('easyBtn').addEventListener('click', () => selectDifficulty('easy'));
document.getElementById('mediumBtn').addEventListener('click', () => selectDifficulty('medium'));
document.getElementById('hardBtn').addEventListener('click', () => selectDifficulty('hard'));

document.getElementById('rematchBtn').addEventListener('click', rematchGame);
document.getElementById('resetBtn').addEventListener('click', resetGame);

// ============================================
// HELPER FUNCTIONS
// ============================================

// Update move counter
function updateMoveCounter() {
  const moveCount = board.filter(cell => cell !== null).length;
  moveCounterEl.textContent = `🎯 Moves: ${moveCount}`;
}

// Timer functions
function startTimer() {
  gameStartTime = Date.now();
  stopTimer(); // Clear any existing timer
  timerInterval = setInterval(() => {
    if (gameStartTime && !gameOver) {
      const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
      timerEl.textContent = `⏱️ ${elapsed}s`;
    }
  }, 100);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Sound effects
function playSound(type) {
  if (!soundEnabled) return;
  
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  if (type === 'move') {
    oscillator.frequency.value = 600;
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } else if (type === 'win') {
    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } else if (type === 'draw') {
    oscillator.frequency.value = 500;
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }
}

// Confetti animation
function createConfetti() {
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = Math.random() * 50 - 50 + 'px';
    confetti.style.setProperty('--tx', (Math.random() - 0.5) * 200 + 'px');
    confetti.style.backgroundColor = ['#667eea', '#764ba2', '#84fab0', '#8fd3f4', '#ff6b6b'][i % 5];
    confettiContainer.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 3000);
  }
}

// Undo last move
function undoLastMove() {
  if (boardHistory.length === 0 || gameOver) return;
  
  board = boardHistory.pop();
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  
  cells.forEach((cell, index) => {
    cell.textContent = board[index] || '';
    cell.classList.remove('winning-cell', 'played');
    if (board[index]) {
      cell.classList.add('played');
    }
  });
  
  updatePlayerTurn();
  updateMoveCounter();
  playSound('move');
}

// Restore dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}

// Initialize
renderStats();
