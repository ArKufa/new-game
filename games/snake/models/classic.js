class ClassicSnakeModel {
  constructor() {
    this.name = "Классическая";
    this.snakeColor = "#27ae60";
    this.foodColor = "#e74c3c";
    this.backgroundColor = "#2c3e50";
    this.gridColor = "#34495e";
    this.speed = 100;
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
    ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
  }

  drawFood(ctx, food, gridSize) {
    ctx.fillStyle = this.foodColor;
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
  }
}
