class ModernSnakeModel {
  constructor() {
    this.name = "Модерн";
    this.snakeColor = "#9b59b6";
    this.foodColor = "#f1c40f";
    this.backgroundColor = "#1a1a2e";
    this.gridColor = "#16213e";
    this.speed = 80;
  }

  createSnake() {
    return [{x: 10, y: 10}];
  }

  createFood() {
    return {
      x: Math.floor(Math.random() * 20),
      y: Math.floor(Math.random() * 20)
    };
  }

  drawSnake(ctx, segment, gridSize) {
    const gradient = ctx.createLinearGradient(
      segment.x * gridSize, 
      segment.y * gridSize,
      (segment.x + 1) * gridSize,
      (segment.y + 1) * gridSize
    );
    gradient.addColorStop(0, this.snakeColor);
    gradient.addColorStop(1, "#8e44ad");
    
    ctx.fillStyle = gradient;
    ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    
    // Глаза у головы
    if (segment === this.snake[0]) {
      ctx.fillStyle = "white";
      ctx.fillRect(segment.x * gridSize + 5, segment.y * gridSize + 5, 3, 3);
      ctx.fillRect(segment.x * gridSize + 12, segment.y * gridSize + 5, 3, 3);
    }
  }

  drawFood(ctx, food, gridSize) {
    ctx.fillStyle = this.foodColor;
    ctx.beginPath();
    ctx.arc(
      food.x * gridSize + gridSize/2,
      food.y * gridSize + gridSize/2,
      gridSize/2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Блики на еде
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(
      food.x * gridSize + gridSize/3,
      food.y * gridSize + gridSize/3,
      2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}
