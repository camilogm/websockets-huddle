import express from 'express';
import { Server } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { Server as SocketIoServer } from 'socket.io';

const app = express();

app.use(express.static('public'));
app.use(express.json());

const http = new Server(app);
dotenv.config();

const PORT = Number(process.env.NODE_PORT) || 3000;
const io = new SocketIoServer(http);
let secretWord = '';
let attempts = 0;

app.get('/', (req, res) => {
  res.sendFile(path.join(`${__dirname}`, '..', '/public/index.html'));
});

io.on('connection', (socket: any) => {
  const { username, secretWord: playerSecretWord } = socket.handshake.query;

  if (username === 'player1') {
    secretWord = playerSecretWord;
    attempts = 3;
  }

  console.log(`user connected ${username}`);
  console.log(`${socket.client.conn.server.clientsCount} users connected`);

  socket.on('drawing', (e:any) => {
    socket.broadcast.emit('playerDrawing', e);
  });

  socket.on('checkWord', (e:any) => {
    const { word } = e;

    if (word === secretWord) {
      io.emit('gameover', { player: 'player2' });
    } else {
      attempts -= 1;
      socket.emit('fail', { attempts });
    }

    if (attempts <= 0) {
      io.emit('gameover', { player: 'player1' });
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });

  socket.on('clear', () => {
    socket.broadcast.emit('clearViewers');
  });
});

http.listen(PORT, () => console.log(`Server started on PORT: ${PORT} `));
