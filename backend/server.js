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

  socket.on('vote', async ({ pollId, optionId, username }) => {
    try {
      // Validate username
      if (!username || typeof username !== 'string') {
        socket.emit('error', { message: 'Username is required' });
        return;
      }

      const trimmedUsername = username.trim();
      // Normalize username to lower-case to avoid case-sensitive duplicates
      const normalizedUsername = trimmedUsername.toLowerCase();

      // Validate username format (alphanumeric only, max 20 chars)
      if (trimmedUsername.length === 0 || trimmedUsername.length > 20) {
        socket.emit('error', { message: 'Username must be between 1 and 20 characters' });
        return;
      }

      if (!/^[a-zA-Z0-9]+$/.test(trimmedUsername)) {
        socket.emit('error', { message: 'Username can only contain letters and numbers' });
        return;
      }

      // Get IP address for rate limiting
      const ip = socket.handshake.headers['x-forwarded-for']?.split(',')[0] ||
        socket.handshake.address;
      const rateLimitKeyIp = `${pollId}:ip:${ip}`;
      const rateLimitKeyUser = `${pollId}:user:${normalizedUsername}`;

      // Check rate limit (both by IP and by normalized username)
      const lastVoteTimeIp = voteRateLimit.get(rateLimitKeyIp);
      const lastVoteTimeUser = voteRateLimit.get(rateLimitKeyUser);
      const now = Date.now();

      if ((lastVoteTimeIp && (now - lastVoteTimeIp) < RATE_LIMIT_WINDOW) ||
          (lastVoteTimeUser && (now - lastVoteTimeUser) < RATE_LIMIT_WINDOW)) {
        const remainingIp = lastVoteTimeIp ? Math.ceil((RATE_LIMIT_WINDOW - (now - lastVoteTimeIp)) / 1000) : 0;
        const remainingUser = lastVoteTimeUser ? Math.ceil((RATE_LIMIT_WINDOW - (now - lastVoteTimeUser)) / 1000) : 0;
        const remainingTime = Math.max(remainingIp, remainingUser);
        socket.emit('error', {
          message: `Please wait ${remainingTime} seconds before voting again on this poll.`
        });
        return;
      }

      // Short-circuit: if the user already has a vote on this exact option, do nothing
      const alreadyVoted = await Poll.findOne({ id: pollId, "options._id": optionId, "options.votes.username": normalizedUsername });
      if (alreadyVoted) {
        const freshPoll = await Poll.findOne({ id: pollId });
        if (freshPoll) {
          freshPoll.options.forEach(option => {
            option.voteCount = option.votes ? option.votes.length : 0;
          });
          await freshPoll.save();
          io.to(pollId).emit('pollUpdated', freshPoll);
        }
        return;
      }

      // 1. Atomic Pull: Remove user from ALL options in this poll
      await Poll.updateOne(
        { id: pollId },
        {
          $pull: {
            "options.$[].votes": { username: normalizedUsername }
          }
        }
      );

      // 2. Atomic Push: Add user to the specific option
      const updateResult = await Poll.updateOne(
        { id: pollId, "options._id": optionId },
        {
          $push: {
            "options.$.votes": {
              username: normalizedUsername,
              votedAt: new Date()
            }
          }
        }
      );

      if (updateResult.modifiedCount === 0) {
        socket.emit('error', { message: 'Failed to record vote. Poll or option not found.' });
        return;
      }

      // 3. Update voters list (for unique voter tracking)
      // Check if voter exists
      const pollCheck = await Poll.findOne({ id: pollId, "voters.username": normalizedUsername });

      if (pollCheck) {
        // Update existing voter
        await Poll.updateOne(
          { id: pollId, "voters.username": normalizedUsername },
          {
            $set: {
              "voters.$.currentVote": optionId,
              "voters.$.votedAt": new Date()
            }
          }
        );
      } else {
        // Add new voter
        await Poll.updateOne(
          { id: pollId },
          {
            $push: {
              voters: {
                username: normalizedUsername,
                currentVote: optionId,
                votedAt: new Date()
              }
            }
          }
        );
      }

      // 4. Fetch the fresh poll to calculate counts and broadcast
      const freshPoll = await Poll.findOne({ id: pollId });

      if (!freshPoll) {
        socket.emit('error', { message: 'Poll not found after voting' });
        return;
      }

      // Recalculate vote counts strictly from the arrays
      freshPoll.options.forEach(option => {
        option.voteCount = option.votes ? option.votes.length : 0;
      });

      await freshPoll.save(); // Save the recalculated counts

      // Update rate limit timestamps for both IP and username
      voteRateLimit.set(rateLimitKeyIp, now);
      voteRateLimit.set(rateLimitKeyUser, now);

      // Emit the full updated poll to everyone in the room
      io.to(pollId).emit('pollUpdated', freshPoll);
    } catch (err) {
      console.error('Error voting:', err);
      socket.emit('error', { message: 'Error recording vote: ' + err.message });
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
