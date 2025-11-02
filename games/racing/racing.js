const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const loginScreen = document.getElementById('loginScreen');
const gameScreen = document.getElementById('gameScreen');
const trackSelect = document.getElementById('trackSelect');
const carSelect = document.getElementById('carSelect');
const playersContainer = document.getElementById('playersContainer');
const leaderboardList = document.getElementById('leaderboardList');
const raceStatus = document.getElementById('raceStatus');

let socket;
let players = {};
let myPlayerId = null;
let currentTrack = null;
let keys = {};

// 3D проекция
const camera = {
  x: 0,
  y: 1000,
  z: 0,
  angle: 0
};

const tracks = {
  desert: {
    name: "Пустыня",
    color: "#D2691E",
    length: 3000,
    segments: [
      {x: 0, z: 0, width: 800},
      {x: 1000, z: 500, width: 800},
      {x: 500, z: 1500, width: 600},
      {x: -500, z: 1000, width: 800}
    ]
  },
  city: {
    name: "Город",
    color: "#708090", 
    length: 2500,
    segments: [
      {x: 0, z: 0, width: 700},
      {x: 800, z: 0, width: 700},
      {x: 800, z: 800, width: 600},
      {x: 0, z: 800, width: 700}
    ]
  },
  mountain: {
    name: "Горы",
    color: "#228B22",
    length: 3500,
    segments: [
      {x: 0, z: 0, width: 600},
      {x: 500, z: 800, width: 500},
      {x: 0, z: 1600, width: 600},
      {x: -500, z: 2400, width: 500}
    ]
  }
};

const cars = {
  sports: { name: "Спорткар", color: "#e74c3c", speed: 2.5 },
  monster: { name: "Монстр трак", color: "#3498db", speed: 2.0 },
  classic: { name: "Классика", color: "#f1c40f", speed: 1.8 }
};

function joinGame() {
  const playerName = document.getElementById('playerName').value.trim();
  const carType = carSelect.value;
  
  if (!playerName) {
    alert('Пожалуйста, введите ваше имя');
    return;
  }
  
  socket = io();
  
  socket.on('connect', () => {
    myPlayerId = socket.id;
    socket.emit('join-game', { playerName, carType });
  });
  
  socket.on('game-state', (gameState) => {
    players = gameState.players;
    currentTrack = gameState.track;
    updatePlayersList();
  });
  
  socket.on('track-changed', (track) => {
    currentTrack = track;
    raceStatus.textContent = `Трасса изменена: ${track.name}`;
  });
  
  socket.on('player-joined', (data) => {
    players[data.id] = data.position;
    updatePlayersList();
  });
  
  socket.on('player-left', (playerId) => {
    delete players[playerId];
    updatePlayersList();
  });
  
  socket.on('player-updated', (data) => {
    if (players[data.id]) {
      players[data.id] = data.position;
    }
  });
  
  socket.on('game-update', (gameState) => {
    players = gameState.players;
    drawGame();
    updateLeaderboard();
  });
  
  socket.on('player-finished', (data) => {
    raceStatus.textContent = `🏁 ${data.name} финишировал!`;
  });
  
  socket.on('player-lap', (data) => {
    raceStatus.textContent = `⏱️ ${data.name} завершил круг ${data.lap}!`;
  });
  
  loginScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  
  // Управление
  document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    handleInput();
  });
  
  document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    handleInput();
  });
}

function handleInput() {
  if (!socket || !myPlayerId || !players[myPlayerId]) return;
  
  const player = players[myPlayerId];
  let speed = 0;
  let rotation = player.rotation || 0;
  
  if (keys['ArrowUp'] || keys['w']) {
    speed = cars[player.carType].speed;
  }
  if (keys['ArrowDown'] || keys['s']) {
    speed = -1;
  }
  if (keys['ArrowLeft'] || keys['a']) {
    rotation -= 0.05;
  }
  if (keys['ArrowRight'] || keys['d']) {
    rotation += 0.05;
  }
  
  // Обновление позиции
  const newX = player.x + Math.sin(rotation) * speed * 10;
  const newZ = player.z + Math.cos(rotation) * speed * 10;
  
  socket.emit('player-move', {
    speed: Math.max(speed, 0),
    rotation: rotation,
    x: newX,
    z: newZ
  });
}

function changeTrack() {
  const trackName = trackSelect.value;
  if (socket) {
    socket.emit('select-track', trackName);
  }
}

function updatePlayersList() {
  playersContainer.innerHTML = '';
  Object.values(players).forEach(player => {
    const playerElement = document.createElement('div');
    playerElement.className = 'player-item';
    playerElement.innerHTML = `
      <span class="car-color" style="background: ${cars[player.carType].color}"></span>
      ${player.name} ${player.finished ? '🏁' : `Круг ${player.lap || 1}`}
    `;
    playersContainer.appendChild(playerElement);
  });
}

function updateLeaderboard() {
  const sortedPlayers = Object.values(players)
    .sort((a, b) => b.progress - a.progress);
  
  leaderboardList.innerHTML = '';
  sortedPlayers.forEach((player, index) => {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';
    item.innerHTML = `
      <span class="position">${index + 1}</span>
      <span class="name">${player.name}</span>
      <span class="car-type">${cars[player.carType].name}</span>
      <span class="progress">${Math.round(player.progress)}m</span>
      <span class="lap">Круг ${player.lap || 1}</span>
      ${player.finished ? '<span class="finished">🏁</span>' : ''}
    `;
    leaderboardList.appendChild(item);
  });
}

function project3D(x, y, z) {
  const scale = 1000 / (z + 1000);
  return {
    x: canvas.width / 2 + (x - camera.x) * scale,
    y: canvas.height / 2 - (y - camera.y) * scale
  };
}

function drawTrack() {
  if (!currentTrack) return;
  
  const track = tracks[currentTrack.name?.toLowerCase()] || tracks.desert;
  
  // Рисуем дорогу
  ctx.fillStyle = track.color;
  ctx.beginPath();
  
  track.segments.forEach((segment, index) => {
    const nextSegment = track.segments[(index + 1) % track.segments.length];
    
    const p1 = project3D(segment.x - segment.width/2, 0, segment.z);
    const p2 = project3D(segment.x + segment.width/2, 0, segment.z);
    const p3 = project3D(nextSegment.x + nextSegment.width/2, 0, nextSegment.z);
    const p4 = project3D(nextSegment.x - nextSegment.width/2, 0, nextSegment.z);
    
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.lineTo(p1.x, p1.y);
  });
  
  ctx.fill();
  
  // Разметка
  ctx.strokeStyle = 'white';
  ctx.setLineDash([20, 20]);
  ctx.lineWidth = 2;
  
  track.segments.forEach((segment, index) => {
    const nextSegment = track.segments[(index + 1) % track.segments.length];
    const center1 = project3D(segment.x, 0, segment.z);
    const center2 = project3D(nextSegment.x, 0, nextSegment.z);
    
    ctx.beginPath();
    ctx.moveTo(center1.x, center1.y);
    ctx.lineTo(center2.x, center2.y);
    ctx.stroke();
  });
  
  ctx.setLineDash([]);
}

function drawCar(x, z, rotation, color, isPlayer = false) {
  const pos = project3D(x, 50, z);
  if (!pos) return;
  
  const size = isPlayer ? 8 : 6;
  
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(rotation);
  
  // Кузов
  ctx.fillStyle = color;
  ctx.fillRect(-size, -size/2, size*2, size);
  
  // Окна
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(-size/2, -size/3, size, size/3);
  
  // Фары
  ctx.fillStyle = 'yellow';
  ctx.fillRect(size-2, -size/4, 2, 2);
  ctx.fillRect(size-2, size/4-2, 2, 2);
  
  if (isPlayer) {
    // Выделение игрока
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(-size-1, -size/2-1, size*2+2, size+2);
  }
  
  ctx.restore();
}

function drawGame() {
  // Clear canvas
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw horizon
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height/2);
  gradient.addColorStop(0, '#1e90ff');
  gradient.addColorStop(1, '#87CEEB');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height/2);
  
  // Draw track
  drawTrack();
  
  // Draw players
  Object.values(players).forEach(player => {
    drawCar(
      player.x, 
      player.z, 
      player.rotation || 0, 
      cars[player.carType].color,
      player.id === myPlayerId
    );
    
    // Draw player name
    const pos = project3D(player.x, 100, player.z);
    if (pos) {
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, pos.x, pos.y - 20);
    }
  });
  
  // Update camera to follow player
  if (myPlayerId && players[myPlayerId]) {
    const player = players[myPlayerId];
    camera.x = player.x;
    camera.z = player.z - 500;
    camera.angle = player.rotation || 0;
  }
}

// Game loop
setInterval(() => {
  if (gameScreen.classList.contains('hidden')) return;
  drawGame();
}, 1000 / 60);
