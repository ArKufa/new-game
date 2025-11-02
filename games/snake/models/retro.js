class RetroSnakeModel {
  constructor() {
    this.name = "Ретро";
    this.snakeColor = "#00ff00";
    this.foodColor = "#ff0000";
    this.backgroundColor = "#000000";
    this.gridColor = "#333333";
    this.speed = 120;
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
    ctx.fillStyle = this.snakeColor;
    ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    
    // Пиксельный эффект
    ctx.fillStyle = "#00cc00";
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        ctx.fillRect(
          segment.x * gridSize + i * 2 + 2,
          segment.y * gridSize + j * 2 + 2,
          1, 1
        );
      }
    }
  }

  drawFood(ctx, food, gridSize) {
    ctx.fillStyle = this.foodColor;
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    
    // Пиксельный эффект
    ctx.fillStyle = "#cc0000";
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        ctx.fillRect(
          food.x * gridSize + i * 2 + 2,
          food.y * gridSize + j * 2 + 2,
          1, 1
        );
      }
    }
  }
}
