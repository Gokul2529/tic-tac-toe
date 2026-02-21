// Board state
let board = Array(9).fill(null);

// Game variables
let currentPlayer = 'X';
let gameOver = false;
let vsAI = false;

// Stats
let stats = {
  X: 0,
  O: 0,
  draws: 0
};

// DOM elements
const cells = document.querySelectorAll('.cell');
const message = document.getElementById('message');
const xWinsEl = document.getElementById('xWins');
const oWinsEl = document.getElementById('oWins');
const drawsEl = document.getElementById('draws');

// Winning combinations
const winningLines = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

// Cell click handling
cells.forEach(cell => {
  cell.addEventListener('click', () => {
    const index = cell.dataset.index;
    handleClick(index);
  });
});

// Handle player move
function handleClick(index) {
  if (board[index] || gameOver) return;

  board[index] = currentPlayer;
  updateUI(index, currentPlayer);

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

  if (vsAI && currentPlayer === 'O') {
    setTimeout(aiMove, 500);
  }
}

// Update UI
function updateUI(index, player) {
  cells[index].textContent = player;
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

  if (winner) {
    stats[winner]++;
    message.textContent = `Player ${winner} wins!`;
    highlightCells(winningLine);
  } else {
    stats.draws++;
    message.textContent = "It's a draw!";
  }

  renderStats();
}

// Highlight winning cells
function highlightCells(line) {
  line.forEach(index => {
    cells[index].classList.add('winning-cell');
  });
}

// AI move (random)
function aiMove() {
  const emptyCells = board
    .map((val, idx) => val === null ? idx : null)
    .filter(val => val !== null);

  if (emptyCells.length === 0) return;

  const choice = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  handleClick(choice);
}

// Rematch (keep stats)
function rematchGame() {
  board = Array(9).fill(null);
  gameOver = false;
  currentPlayer = 'X';
  message.textContent = '';
  cells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('winning-cell');
  });
}

// Reset (clear everything)
function resetGame() {
  rematchGame();
  stats = { X: 0, O: 0, draws: 0 };
  renderStats();
}

// Render stats
function renderStats() {
  xWinsEl.textContent = stats.X;
  oWinsEl.textContent = stats.O;
  drawsEl.textContent = stats.draws;
}

// Mode buttons
document.getElementById('twoPlayerBtn').addEventListener('click', () => {
  vsAI = false;
  resetGame();
  message.textContent = "Two Player Mode";
});

document.getElementById('aiBtn').addEventListener('click', () => {
  vsAI = true;
  resetGame();
  message.textContent = "Playing vs AI";
});

// Control buttons
document.getElementById('rematchBtn').addEventListener('click', rematchGame);
document.getElementById('resetBtn').addEventListener('click', resetGame);
