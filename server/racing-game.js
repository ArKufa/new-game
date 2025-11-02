class RacingGame {
  constructor() {
    this.players = new Map();
    this.gameState = {
      players: {},
      gameStarted: false,
      trackLength: 2000
    };
  }

  initialize(io) {
    this.io = io;

    io.on('connection', (socket) => {
      console.log('Player connected:', socket.id);

      socket.on('join-game', (playerName) => {
        this.addPlayer(socket.id, playerName);
        socket.emit('game-state', this.gameState);
        socket.broadcast.emit('player-joined', {
          id: socket.id,
          name: playerName,
          position: this.gameState.players[socket.id]
        });
      });

      socket.on('player-move', (data) => {
        this.updatePlayerPosition(socket.id, data);
        socket.broadcast.emit('player-updated', {
          id: socket.id,
          position: this.gameState.players[socket.id]
        });
      });

      socket.on('disconnect', () => {
        this.removePlayer(socket.id);
        socket.broadcast.emit('player-left', socket.id);
      });
    });

    // Game loop
    setInterval(() => {
      this.updateGame();
    }, 1000 / 60);
  }

  addPlayer(id, name) {
    this.gameState.players[id] = {
      id: id,
      name: name,
      x: 100,
      y: Object.keys(this.gameState.players).length * 80 + 100,
      speed: 0,
      progress: 0,
      finished: false
    };
  }

  removePlayer(id) {
    delete this.gameState.players[id];
  }

  updatePlayerPosition(id, data) {
    const player = this.gameState.players[id];
    if (player && !player.finished) {
      player.speed = data.speed;
      player.progress += player.speed;
      
      if (player.progress >= this.gameState.trackLength) {
        player.progress = this.gameState.trackLength;
        player.finished = true;
        this.io.emit('player-finished', { id, position: player.progress });
      }
    }
  }

  updateGame() {
    this.io.emit('game-update', this.gameState);
  }
}

module.exports = new RacingGame();
