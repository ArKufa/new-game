const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 20;

let board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
let score = 0;
let level = 1;
let lines = 0;
let gameOver = false;
let isPaused = false;

const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]]  // Z
];

const COLORS = ['#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];

let currentPiece = null;
let nextPiece = null;

function createPiece() {
    const shapeId = Math.floor(Math.random() * SHAPES.length);
    return {
        shape: SHAPES[shapeId],
        color: COLORS[shapeId],
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(SHAPES[shapeId][0].length / 2),
        y: 0
    };
}

function drawBlock(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw settled pieces
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x]) {
                drawBlock(ctx, x, y, board[y][x]);
            }
        }
    }
    
    // Draw current piece
    if (currentPiece) {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, currentPiece.color);
                }
            });
        });
    }
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(nextCtx, x + 1, y + 1, nextPiece.color);
                }
            });
        });
    }
}

function rotate(piece) {
    const rotated = piece.shape[0].map((_, i) =>
        piece.shape.map(row => row[i]).reverse()
    );
    return { ...piece, shape: rotated };
}

function isValidMove(piece, newX, newY, newShape = piece.shape) {
    return newShape.every((row, y) =>
        row.every((value, x) => {
            if (value === 0) return true;
            const boardX = newX + x;
            const boardY = newY + y;
            return (
                boardX >= 0 &&
                boardX < BOARD_WIDTH &&
                boardY < BOARD_HEIGHT &&
                (boardY < 0 || board[boardY][boardX] === 0)
            );
        })
    );
}

function mergePiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value && currentPiece.y + y >= 0) {
                board[currentPiece.y + y][currentPiece.x + x] = currentPiece.color;
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++;
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        level = Math.floor(lines / 10) + 1;
        updateDisplay();
    }
}

function updateDisplay() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
}

function dropPiece() {
    if (!currentPiece) return;
    
    if (isValidMove(currentPiece, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
    } else {
        mergePiece();
        clearLines();
        currentPiece = nextPiece;
        nextPiece = createPiece();
        drawNextPiece();
        
        if (!isValidMove(currentPiece, currentPiece.x, currentPiece.y)) {
            gameOver = true;
            alert('Игра окончена! Ваш счет: ' + score);
            resetGame();
        }
    }
}

function resetGame() {
    board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    isPaused = false;
    currentPiece = createPiece();
    nextPiece = createPiece();
    updateDisplay();
    drawNextPiece();
}

document.addEventListener('keydown', (e) => {
    if (isPaused || gameOver) return;
    
    if (!currentPiece) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            if (isValidMove(currentPiece, currentPiece.x - 1, currentPiece.y)) {
                currentPiece.x--;
            }
            break;
        case 'ArrowRight':
            if (isValidMove(currentPiece, currentPiece.x + 1, currentPiece.y)) {
                currentPiece.x++;
            }
            break;
        case 'ArrowDown':
            if (isValidMove(currentPiece, currentPiece.x, currentPiece.y + 1)) {
                currentPiece.y++;
            }
            break;
        case 'ArrowUp':
            const rotated = rotate(currentPiece);
            if (isValidMove(currentPiece, currentPiece.x, currentPiece.y, rotated.shape)) {
                currentPiece.shape = rotated.shape;
            }
            break;
        case ' ':
            isPaused = !isPaused;
            break;
    }
});

function gameLoop() {
    if (!isPaused && !gameOver) {
        dropPiece();
        drawBoard();
    }
    setTimeout(gameLoop, 1000 / (level + 1));
}

// Initialize game
resetGame();
gameLoop();
