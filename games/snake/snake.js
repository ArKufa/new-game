const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const modelSelect = document.getElementById('modelSelect');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let currentModel = null;
let models = {};

highScoreElement.textContent = highScore;

// Загрузка моделей
async function loadModels() {
  try {
    const response = await fetch('/games/snake/models/classic.js');
    const classicCode = await response.text();
    eval(classicCode);
    models.classic = new ClassicSnakeModel();
    
    const modernCode = await fetch('/games/snake/models/modern.js').then(r => r.text());
    eval(modernCode);
    models.modern = new ModernSnakeModel();
    
    const retroCode = await fetch('/games/snake/models/retro.js').then(r => r.text());
    eval(retroCode);
    models.retro = new RetroSnakeModel();
    
    currentModel = models.classic;
    resetGame();
  } catch (error) {
    console.error('Error loading models:', error);
    // Fallback модели
    models = {
      classic: new (class {
        constructor() {
          this.name = "Классическая";
          this.snakeColor = "#27ae60";
          this.foodColor = "#e74c3c";
          this.backgroundColor = "#2c3e50";
          this.speed = 100;
        }
        createSnake() { return [{x: 10, y: 10}]; }
        createFood() { return {x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20} }; }
        drawSnake(ctx, segment, gridSize) { ctx.fillStyle = this.snakeColor; ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2); }
        drawFood(ctx, food, gridSize) { ctx.fillStyle = this.foodColor; ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2); }
      })()
    };
    currentModel = models.classic;
    resetGame();
  }
}

function changeModel() {
  const selectedModel = modelSelect.value;
  if (models[selectedModel]) {
    currentModel = models[selectedModel];
    resetGame();
  }
}

function randomFood() {
  food = currentModel.createFood();
}

function drawGame() {
  // Clear canvas
  ctx.fillStyle = currentModel.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid
  if (currentModel.gridColor) {
    ctx.strokeStyle = currentModel.gridColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < tileCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSize, 0);
      ctx.lineTo(i * gridSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * gridSize);
      ctx.lineTo(canvas.width, i * gridSize);
      ctx.stroke();
    }
  }
  
  // Draw snake
  snake.forEach((segment, index) => {
    currentModel.drawSnake(ctx, segment, gridSize, index === 0);
  });
  
  // Draw food
  currentModel.drawFood(ctx, food, gridSize);
  
  // Move snake
  const head = {x: snake[0].x + dx, y: snake[0].y + dy};
  snake.unshift(head);
  
  // Check food collision
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreElement.textContent = score;
    randomFood();
  } else {
    snake.pop();
  }
  
  // Check game over
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount ||
      snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
    
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('snakeHighScore', highScore);
      highScoreElement.textContent = highScore;
    }
    
    resetGame();
  }
}

function resetGame() {
  snake = currentModel.createSnake();
  dx = 0;
  dy = 0;
  score = 0;
  scoreElement.textContent = score;
  randomFood();
}

function changeDirection(event) {
  const LEFT_KEY = 37;
  const RIGHT_KEY = 39;
  const UP_KEY = 38;
  const DOWN_KEY = 40;
  
  const keyPressed = event.keyCode;
  const goingUp = dy === -1;
  const goingDown = dy === 1;
  const goingRight = dx === 1;
  const goingLeft = dx === -1;
  
  if (keyPressed === LEFT_KEY && !goingRight) {
    dx = -1;
    dy = 0;
  }
  if (keyPressed === UP_KEY && !goingDown) {
    dx = 0;
    dy = -1;
  }
  if (keyPressed === RIGHT_KEY && !goingLeft) {
    dx = 1;
    dy = 0;
  }
  if (keyPressed === DOWN_KEY && !goingUp) {
    dx = 0;
    dy = 1;
  }
}

document.addEventListener('keydown', changeDirection);
modelSelect.addEventListener('change', changeModel);

// Initialize game
loadModels();
setInterval(drawGame, currentModel ? currentModel.speed : 100);
