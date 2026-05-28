const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;
const INITIAL_DROP_INTERVAL = 800;
const LEVEL_SPEED_FACTOR = 0.85;
const MIN_DROP_INTERVAL = 100;

const SHAPES = {
  I: { matrix: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#00f0f0' },
  O: { matrix: [[1,1],[1,1]], color: '#f0f000' },
  T: { matrix: [[0,1,0],[1,1,1],[0,0,0]], color: '#a000f0' },
  S: { matrix: [[0,1,1],[1,1,0],[0,0,0]], color: '#00f000' },
  Z: { matrix: [[1,1,0],[0,1,1],[0,0,0]], color: '#f00000' },
  J: { matrix: [[1,0,0],[1,1,1],[0,0,0]], color: '#0000f0' },
  L: { matrix: [[0,0,1],[1,1,1],[0,0,0]], color: '#f0a000' }
};

const PIECE_KEYS = Object.keys(SHAPES);

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');

let game = null;

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function fillBag() {
  return shuffleArray([...PIECE_KEYS]);
}

function getNextFromBag() {
  if (!game.bag || game.bag.length === 0) {
    game.bag = fillBag();
  }
  return game.bag.pop();
}

function createPiece(key) {
  const shape = SHAPES[key].matrix.map(row => [...row]);
  const x = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
  const y = 0;
  return { type: key, shape, x, y };
}

function rotateMatrix(matrix) {
  const n = matrix.length;
  const rotated = [];
  for (let col = 0; col < n; col++) {
    rotated[col] = [];
    for (let row = n - 1; row >= 0; row--) {
      rotated[col].push(matrix[row][col]);
    }
  }
  return rotated;
}

function initGame() {
  const board = [];
  for (let r = 0; r < BOARD_HEIGHT; r++) {
    board[r] = new Array(BOARD_WIDTH).fill(null);
  }
  game = {
    board,
    current: null,
    next: null,
    score: 0,
    level: 1,
    lines: 0,
    gameOver: false,
    paused: false,
    dropTimer: 0,
    dropInterval: INITIAL_DROP_INTERVAL,
    animationId: null,
    bag: [],
    _lastTimestamp: 0
  };
  game.next = createPiece(getNextFromBag());
  spawnPiece();
  updateUI();
}

function spawnPiece() {
  if (!game.next) {
    game.next = createPiece(getNextFromBag());
  }
  game.current = game.next;
  game.next = createPiece(getNextFromBag());
  if (!isValidMove(game.current.shape, game.current.x, game.current.y)) {
    game.gameOver = true;
  }
}

function isValidMove(shape, x, y) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const boardX = x + c;
        const boardY = y + r;
        if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
          return false;
        }
        if (boardY >= 0 && game.board[boardY][boardX] !== null) {
          return false;
        }
      }
    }
  }
  return true;
}

function lockPiece() {
  if (!game.current) return;
  const { shape, x, y, type } = game.current;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const boardX = x + c;
        const boardY = y + r;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          game.board[boardY][boardX] = type;
        }
      }
    }
  }
  const cleared = clearLines();
  if (cleared > 0) {
    updateScore(cleared);
  }
  spawnPiece();
  updateUI();
}

function clearLines() {
  let cleared = 0;
  for (let r = BOARD_HEIGHT - 1; r >= 0; r--) {
    if (game.board[r].every(cell => cell !== null)) {
      game.board.splice(r, 1);
      game.board.unshift(new Array(BOARD_WIDTH).fill(null));
      cleared++;
      r++;
    }
  }
  return cleared;
}

function updateScore(linesCleared) {
  const points = [0, 100, 300, 500, 800];
  const addScore = (points[linesCleared] || 0) * game.level;
  game.score += addScore;
  game.lines += linesCleared;
  const newLevel = Math.floor(game.lines / 10) + 1;
  if (newLevel > game.level) {
    game.level = newLevel;
    game.dropInterval = Math.max(MIN_DROP_INTERVAL, INITIAL_DROP_INTERVAL * Math.pow(LEVEL_SPEED_FACTOR, game.level - 1));
  }
}

function updateUI() {
  scoreEl.textContent = game.score;
  levelEl.textContent = game.level;
  linesEl.textContent = game.lines;
}

function moveLeft() {
  if (!game.current || game.gameOver || game.paused) return;
  if (isValidMove(game.current.shape, game.current.x - 1, game.current.y)) {
    game.current.x--;
  }
}

function moveRight() {
  if (!game.current || game.gameOver || game.paused) return;
  if (isValidMove(game.current.shape, game.current.x + 1, game.current.y)) {
    game.current.x++;
  }
}

function moveDown() {
  if (!game.current || game.gameOver || game.paused) return;
  if (isValidMove(game.current.shape, game.current.x, game.current.y + 1)) {
    game.current.y++;
    return true;
  }
  lockPiece();
  return false;
}

function rotatePiece() {
  if (!game.current || game.gameOver || game.paused) return;
  const rotated = rotateMatrix(game.current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (isValidMove(rotated, game.current.x + kick, game.current.y)) {
      game.current.shape = rotated;
      game.current.x += kick;
      return;
    }
  }
}

function hardDrop() {
  if (!game.current || game.gameOver || game.paused) return;
  while (isValidMove(game.current.shape, game.current.x, game.current.y + 1)) {
    game.current.y++;
  }
  lockPiece();
}

function getGhostY() {
  if (!game.current) return 0;
  let ghostY = game.current.y;
  while (isValidMove(game.current.shape, game.current.x, ghostY + 1)) {
    ghostY++;
  }
  return ghostY;
}

function drawBlock(ctx, px, py, colorKey, alpha) {
  const x = px * BLOCK_SIZE;
  const y = py * BLOCK_SIZE;
  const color = SHAPES[colorKey] ? SHAPES[colorKey].color : colorKey;
  ctx.globalAlpha = alpha != null ? alpha : 1;
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, 3);
  ctx.fillRect(x + 1, y + 1, 3, BLOCK_SIZE - 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + BLOCK_SIZE - 4, y + 1, 3, BLOCK_SIZE - 2);
  ctx.fillRect(x + 1, y + BLOCK_SIZE - 4, BLOCK_SIZE - 2, 3);
  ctx.globalAlpha = 1;
}

function drawBoard() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, BOARD_WIDTH * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= BOARD_HEIGHT; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK_SIZE);
    ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, r * BLOCK_SIZE);
    ctx.stroke();
  }
  for (let c = 0; c <= BOARD_WIDTH; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK_SIZE, 0);
    ctx.lineTo(c * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
    ctx.stroke();
  }
}

function drawLockedPieces() {
  for (let r = 0; r < BOARD_HEIGHT; r++) {
    for (let c = 0; c < BOARD_WIDTH; c++) {
      if (game.board[r][c] !== null) {
        drawBlock(ctx, c, r, game.board[r][c]);
      }
    }
  }
}

function drawGhostPiece() {
  if (!game.current || game.gameOver) return;
  const ghostY = getGhostY();
  const { shape, x, type } = game.current;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        drawBlock(ctx, x + c, ghostY + r, type, 0.2);
      }
    }
  }
}

function drawCurrentPiece() {
  if (!game.current || game.gameOver) return;
  const { shape, x, y, type } = game.current;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        drawBlock(ctx, x + c, y + r, type);
      }
    }
  }
}

function drawGameOverScreen() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, BOARD_WIDTH * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', (BOARD_WIDTH * BLOCK_SIZE) / 2, (BOARD_HEIGHT * BLOCK_SIZE) / 2 - 20);
  ctx.font = '16px monospace';
  ctx.fillText('Press Enter to restart', (BOARD_WIDTH * BLOCK_SIZE) / 2, (BOARD_HEIGHT * BLOCK_SIZE) / 2 + 20);
}

function drawPauseScreen() {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, BOARD_WIDTH * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', (BOARD_WIDTH * BLOCK_SIZE) / 2, (BOARD_HEIGHT * BLOCK_SIZE) / 2);
}

function drawNextPiece() {
  nextCtx.fillStyle = '#111';
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!game.next) return;
  const shape = game.next.shape;
  const colorKey = game.next.type;
  const cols = shape[0].length;
  const rows = shape.length;
  const offsetX = (nextCanvas.width - cols * BLOCK_SIZE) / 2;
  const offsetY = (nextCanvas.height - rows * BLOCK_SIZE) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (shape[r][c]) {
        const px = offsetX / BLOCK_SIZE + c;
        const py = offsetY / BLOCK_SIZE + r;
        const bx = px * BLOCK_SIZE;
        const by = py * BLOCK_SIZE;
        nextCtx.fillStyle = SHAPES[colorKey].color;
        nextCtx.fillRect(bx + 1, by + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        nextCtx.fillStyle = 'rgba(255,255,255,0.3)';
        nextCtx.fillRect(bx + 1, by + 1, BLOCK_SIZE - 2, 3);
        nextCtx.fillRect(bx + 1, by + 1, 3, BLOCK_SIZE - 2);
        nextCtx.fillStyle = 'rgba(0,0,0,0.3)';
        nextCtx.fillRect(bx + BLOCK_SIZE - 4, by + 1, 3, BLOCK_SIZE - 2);
        nextCtx.fillRect(bx + 1, by + BLOCK_SIZE - 4, BLOCK_SIZE - 2, 3);
      }
    }
  }
}

function render() {
  drawBoard();
  drawLockedPieces();
  drawGhostPiece();
  drawCurrentPiece();
  drawNextPiece();
  if (game.gameOver) {
    drawGameOverScreen();
  } else if (game.paused) {
    drawPauseScreen();
  }
}

function update(deltaTime) {
  if (game.gameOver || game.paused || !game.current) return;
  game.dropTimer += deltaTime;
  if (game.dropTimer >= game.dropInterval) {
    game.dropTimer = 0;
    if (!isValidMove(game.current.shape, game.current.x, game.current.y + 1)) {
      lockPiece();
    } else {
      game.current.y++;
    }
  }
}

function gameLoop(timestamp) {
  if (!game._lastTimestamp) {
    game._lastTimestamp = timestamp;
  }
  const deltaTime = timestamp - game._lastTimestamp;
  game._lastTimestamp = timestamp;
  update(deltaTime);
  render();
  game.animationId = requestAnimationFrame(gameLoop);
}

function handleKeyDown(e) {
  const key = e.key;
  e.preventDefault();
  if (game.gameOver) {
    if (key === 'Enter') {
      initGame();
    }
    return;
  }
  switch (key) {
    case 'ArrowLeft': moveLeft(); break;
    case 'ArrowRight': moveRight(); break;
    case 'ArrowDown': moveDown(); break;
    case 'ArrowUp': rotatePiece(); break;
    case ' ': hardDrop(); break;
    case 'p':
    case 'P':
      game.paused = !game.paused;
      if (!game.paused) {
        game._lastTimestamp = 0;
      }
      break;
  }
}

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = Date.now();
}

function handleTouchEnd(e) {
  e.preventDefault();
  if (game.gameOver) {
    initGame();
    return;
  }
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  const dt = Date.now() - touchStartTime;
  if (dt < 200 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
    rotatePiece();
    return;
  }
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx > absDy) {
    if (dx > 30) moveRight();
    else if (dx < -30) moveLeft();
  } else {
    if (dy > 30) hardDrop();
    else if (dy < -30) moveDown();
  }
}

document.addEventListener('keydown', handleKeyDown);
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

initGame();
gameLoop(performance.now());