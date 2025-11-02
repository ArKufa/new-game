const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const loginScreen = document.getElementById('loginScreen');
const gameScreen = document.getElementById('gameScreen');
const playerNameInput = document.getElementById('playerName');
const playersContainer = document.getElementById('playersContainer');
const leaderboardList = document.getElementById('leaderboardList');
const raceStatus = document.getElementById('raceStatus');

let socket;
let players = {};
let myPlayerId = null;
let trackLength = 2000;

function joinGame() {
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert('Пожалуйста, введите ваше имя');
        return;
    }
    
    socket = io();
    
    socket.on('connect', () => {
        myPlayerId = socket.id;
        socket.emit('join-game', playerName);
    });
    
    socket.on('game-state', (gameState) => {
        players = gameState.players;
        updatePlayersList();
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
        raceStatus.textContent = `Игрок ${players[data.id]?.name || 'Unknown'} финишировал!`;
    });
    
    loginScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
}

function updatePlayersList() {
    playersContainer.innerHTML = '';
    Object.values(players).forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-item';
        playerElement.textContent = `${player.name} ${player.finished ? '🏁' : ''}`;
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
            <span class="progress">${Math.min(player.progress, trackLength)}m</span>
            ${player.finished ? '<span class="finished">🏁</span>' : ''}
        `;
        leaderboardList.appendChild(item);
    });
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw track
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(50, 0, canvas.width - 100, canvas.height);
    
    // Draw road markings
    ctx.strokeStyle = 'white';
    ctx.setLineDash([10, 20]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw players
    Object.values(players).forEach(player => {
        const progressRatio = player.progress / trackLength;
        const yPosition = player.y;
        const xPosition = 100 + (canvas.width - 200) * progressRatio;
        
        // Draw car
        ctx.fillStyle = player.id === myPlayerId ? '#e74c3c' : '#3498db';
        ctx.fillRect(xPosition - 15, yPosition - 10, 30, 20);
        
        // Draw player name
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, xPosition, yPosition - 15);
        
        // Draw progress
        ctx.fillText(`${Math.min(player.progress, trackLength)}m`, xPosition, yPosition + 35);
    });
    
    // Draw finish line
    ctx.fillStyle = 'black';
    ctx.fillRect(canvas.width - 60, 0, 10, canvas.height);
    ctx.fillStyle = 'white';
    for (let i = 0; i < canvas.height; i += 20) {
        ctx.fillRect(canvas.width - 60, i, 10, 10);
    }
    
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText('ФИНИШ', canvas.width - 55, 20);
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (!socket || !myPlayerId) return;
    
    let speed = 0;
    
    switch(e.key) {
        case 'ArrowLeft':
            socket.emit('player-move', { speed: 5 });
            break;
        case 'ArrowRight':
            socket.emit('player-move', { speed: 10 });
            break;
        case ' ':
            socket.emit('player-move', { speed: 15 });
            break;
    }
});

// Start drawing
setInterval(() => {
    if (gameScreen.classList.contains('hidden')) return;
    drawGame();
}, 1000 / 60);
