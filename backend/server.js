const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/poll-rooms';
console.log('STARTING MONGODB CONNECTION...');
console.log('URI:', mongoUri);

mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB Connected successfully'))
  .catch(err => console.log('MongoDB Connection Error:', err));

const pollRoutes = require('./routes/pollRoutes');
app.use('/api/polls', pollRoutes);

const Poll = require('./models/Poll');

// IP-based rate limiting map: { "pollId:ip": timestamp }
const voteRateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinPoll', (pollId) => {
    socket.join(pollId);
    console.log(`User ${socket.id} joined poll: ${pollId}`);
  });

  socket.on('vote', async ({ pollId, optionId }) => {
    try {
      // Get IP address
      const ip = socket.handshake.headers['x-forwarded-for']?.split(',')[0] ||
        socket.handshake.address;
      const rateLimitKey = `${pollId}:${ip}`;

      // Check rate limit
      const lastVoteTime = voteRateLimit.get(rateLimitKey);
      const now = Date.now();

      if (lastVoteTime && (now - lastVoteTime) < RATE_LIMIT_WINDOW) {
        const remainingTime = Math.ceil((RATE_LIMIT_WINDOW - (now - lastVoteTime)) / 1000);
        socket.emit('error', {
          message: `Please wait ${remainingTime} seconds before voting again on this poll.`
        });
        return;
      }

      // Use atomic update to increment vote count
      const updatedPoll = await Poll.findOneAndUpdate(
        { id: pollId, 'options._id': optionId },
        { $inc: { 'options.$.voteCount': 1 } },
        { new: true }
      );

      if (!updatedPoll) {
        socket.emit('error', { message: 'Poll or option not found' });
        return;
      }

      // Update rate limit timestamp
      voteRateLimit.set(rateLimitKey, now);

      // Emit the full updated poll to everyone in the room
      io.to(pollId).emit('pollUpdated', updatedPoll);
    } catch (err) {
      console.error('Error voting:', err);
      socket.emit('error', { message: 'Error recording vote' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of voteRateLimit.entries()) {
    if (now - timestamp > RATE_LIMIT_WINDOW) {
      voteRateLimit.delete(key);
    }
  }
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
