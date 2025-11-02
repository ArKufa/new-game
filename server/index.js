const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.static(path.join(__dirname, '../static')));
app.use(express.static(path.join(__dirname, '../games')));

// Маршруты для игр
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../static/index.html'));
});

app.get('/snake', (req, res) => {
  res.sendFile(path.join(__dirname, '../games/snake/snake.html'));
});

app.get('/tetris', (req, res) => {
  res.sendFile(path.join(__dirname, '../games/tetris/tetris.html'));
});

app.get('/racing', (req, res) => {
  res.sendFile(path.join(__dirname, '../games/racing/racing.html'));
});

// Мультиплеер для гонок
const racingGame = require('./racing-game');
racingGame.initialize(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
