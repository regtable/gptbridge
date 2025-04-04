import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { connectDB } from './mongo.js';
import dotenv from 'dotenv';
import Message from './models/Message.js';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',  methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const sockets = {};

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  sockets[userId] = socket;
  console.log('🟢 User connected:', userId);

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', userId);
    delete sockets[userId];
  });
});
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientPath = path.join(__dirname, '..', 'client', 'build');

app.use(express.static(clientPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});
app.post('/gpt-route/message', async (req, res) => {
  const { user_id, message_id, payload, timestamp } = req.body;
  if (!user_id || !payload) return res.status(400).json({ error: 'Missing fields' });

  const message = new Message({ user_id, message_id, payload, timestamp, direction: 'to_user' });
  await message.save();

  if (sockets[user_id]) {
    sockets[user_id].emit('message', { from: 'gpt', text: payload });
    return res.json({ status: 'delivered', tracking_id: message_id, callback_url: '/gpt-route/callback' });
  }

  res.status(404).json({ error: 'User not connected' });
});

app.post('/gpt-route/callback', async (req, res) => {
  const { tracking_id, reply, metadata } = req.body;
  if (!tracking_id || !reply) return res.status(400).json({ error: 'Missing fields' });

  const message = new Message({ user_id: 'gpt', message_id: tracking_id, payload: reply, metadata, direction: 'from_gpt' });
  await message.save();

  res.json({ status: 'received' });
});

server.listen(process.env.PORT || 8080, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 8080}`);
});
