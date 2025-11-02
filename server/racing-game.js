class RacingGame {
  constructor() {
    this.players = new Map();
    this.tracks = {
      desert: { length: 3000, color: '#D2691E', name: 'Пустыня' },
      city: { length: 2500, color: '#708090', name: 'Город' },
      mountain: { length: 3500, color: '#228B22', name: 'Горы' }
    };
    this.currentTrack = 'desert';
    this.gameState = {
      players: {},
      gameStarted: false,
      track: this.tracks.desert
    };
  }

  initialize(io) {
    this.io = io;

    io.on('connection', (socket) => {
      console.log('Player connected:', socket.id);

      socket.on('join-game', (data) => {
        this.addPlayer(socket.id, data.playerName, data.carType);
        socket.emit('game-state', this.gameState);
        socket.broadcast.emit('player-joined', {
          id: socket.id,
          name: data.playerName,
          carType: data.carType,
          position: this.gameState.players[socket.id]
        });
      });

      socket.on('select-track', (trackName) => {
        if (this.tracks[trackName]) {
          this.currentTrack = trackName;
          this.gameState.track = this.tracks[trackName];
          this.io.emit('track-changed', this.gameState.track);
        }
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

    setInterval(() => {
      this.updateGame();
    }, 1000 / 60);
  }

  addPlayer(id, name, carType) {
    this.gameState.players[id] = {
      id: id,
      name: name,
      carType: carType || 'sports',
      x: 0,
      y: 0,
      z: 0,
      speed: 0,
      rotation: 0,
      progress: 0,
      finished: false,
      lap: 1,
      position: Object.keys(this.gameState.players).length
    };
  }

  removePlayer(id) {
    delete this.gameState.players[id];
  }

  updatePlayerPosition(id, data) {
    const player = this.gameState.players[id];
    if (player && !player.finished) {
      player.speed = data.speed;
      player.rotation = data.rotation;
      player.x = data.x;
      player.z = data.z;
      player.progress += player.speed;
      
      if (player.progress >= this.gameState.track.length * 3) { // 3 круга
        player.progress = this.gameState.track.length * 3;
        player.finished = true;
        this.io.emit('player-finished', { 
          id, 
          name: player.name,
          position: player.progress 
        });
      } else if (player.progress >= this.gameState.track.length * player.lap) {
        player.lap++;
        this.io.emit('player-lap', { 
          id, 
          name: player.name,
          lap: player.lap 
        });
      }
    }
  }

  updateGame() {
    this.io.emit('game-update', this.gameState);
  }
}

module.exports = new RacingGame();
