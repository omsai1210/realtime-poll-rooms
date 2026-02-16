# Real-Time Poll Rooms

A modern, real-time polling application built with React, Node.js, Socket.io, and MongoDB. Create polls instantly, share links, and watch votes update live across all connected clients.

![Real-Time Poll Rooms](https://img.shields.io/badge/status-production-green)

## ✨ Features

- **⚡ Real-Time Updates**: Votes appear instantly across all connected clients via Socket.io
- **🎨 Beautiful UI**: Glassmorphism design with gradient backgrounds and smooth animations
- **📊 Visual Results**: Animated progress bars showing vote percentages in real-time
- **🔗 Instant Sharing**: Create a poll and share the link immediately
- **🔒 Fair Voting**: Multiple mechanisms to prevent duplicate votes
- **📱 Responsive**: Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v14+)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/realtime-poll-rooms.git
cd realtime-poll-rooms

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

Create a `.env` file in the `backend` directory:

```env
MONGO_URI=mongodb://127.0.0.1:27017/poll-rooms
PORT=5000
```

### Running the Application

**Backend** (Terminal 1):
```bash
cd backend
node server.js
```

**Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` to use the application.

## 📁 Project Structure

```
realtime-poll-rooms/
├── backend/
│   ├── models/
│   │   └── Poll.js          # MongoDB Poll schema
│   ├── routes/
│   │   └── pollRoutes.js    # REST API endpoints
│   ├── scripts/
│   │   ├── seed-poll.js     # Test data seeder
│   │   └── test-socket.js   # Socket.io test script
│   ├── server.js            # Express + Socket.io server
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── CreatePoll.jsx    # Poll creation form
    │   │   └── VotingRoom.jsx    # Real-time voting interface
    │   ├── App.jsx               # React Router setup
    │   └── main.jsx
    ├── package.json
    └── vite.config.js            # Vite + proxy config
```

## 🛡️ Fairness Mechanisms

To ensure voting integrity, this application implements **two complementary fairness mechanisms**:

### 1. Frontend: LocalStorage Tracking (Visual Fairness)

**How it works:**
- When a user votes on a poll, the poll ID is stored in the browser's `localStorage`
- On subsequent visits to the same poll, the app checks `localStorage` and disables voting if the user has already voted
- The user can still view real-time results but cannot vote again

**Limitations:**
- ⚠️ **Bypass method**: Users can clear browser storage or use incognito/private mode to vote again
- ⚠️ **Device-specific**: Votes are tracked per browser, not per person (different devices = different votes)
- ✅ **Best for**: Honest users and casual polls where perfect enforcement isn't critical

### 2. Backend: IP-Based Rate Limiting (Server Enforcement)

**How it works:**
- The server tracks the IP address of each voter for each poll
- A 1-minute cooldown window prevents the same IP from voting multiple times on the same poll
- Rate limit data is stored in memory with automatic cleanup every 5 minutes

**Implementation details:**
```javascript
// Key: "pollId:ipAddress" → Value: timestamp
voteRateLimit.set("abc123:192.168.1.100", Date.now())
```

**Limitations:**
- ⚠️ **Dynamic IPs**: ISPs that rotate IP addresses frequently may allow re-voting after IP changes
- ⚠️ **Shared IPs**: Multiple users behind the same NAT/proxy (e.g., office network, public WiFi) share the same IP and may block each other
- ⚠️ **VPN bypass**: Users can switch VPNs or use proxy servers to get new IPs
- ⚠️ **Memory-only**: Rate limit data is lost on server restart (consider Redis for production persistence)
- ✅ **Best for**: Short-term rate limiting and reducing automated spam

### 🔐 Recommended Use Cases

| Scenario | Recommendation |
|----------|----------------|
| **Casual polls** (fun, non-critical) | Current mechanisms are sufficient |
| **Internal teams** (trusted users) | Frontend localStorage is usually enough |
| **Public polls** (moderate stakes) | Both mechanisms provide reasonable protection |
| **High-stakes voting** (elections, critical decisions) | Implement authentication (OAuth, email verification, etc.) |

### 💡 Future Enhancements for Stricter Fairness

For production use cases requiring stronger guarantees:
- **User Authentication**: Require login via OAuth (Google, GitHub) or email verification
- **Database-Backed Tracking**: Store vote history in MongoDB instead of memory
- **Device Fingerprinting**: Use browser fingerprinting libraries (with user consent/privacy considerations)
- **CAPTCHA**: Add reCAPTCHA to prevent automated voting bots
- **Blockchain**: For cryptographically verifiable, tamper-proof voting records

## 🎨 Tech Stack

- **Frontend**: React 19, React Router, Socket.io Client, Axios, Tailwind CSS v4
- **Backend**: Node.js, Express, Socket.io, MongoDB, Mongoose
- **Build Tools**: Vite, PostCSS, Autoprefixer
- **Real-Time Communication**: Socket.io (WebSocket with fallbacks)

## 🧪 Testing

### Backend Tests

```bash
cd backend
node scripts/seed-poll.js    # Create test poll
node scripts/test-socket.js  # Test real-time voting
```

### Production Build

```bash
cd frontend
npm run build                # Build optimized production bundle
```

## 📡 API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/polls` | Create a new poll |
| `GET` | `/api/polls/:id` | Get poll by ID |

### Socket.io Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `joinPoll` | Client → Server | `pollId` | Join a poll room |
| `vote` | Client → Server | `{ pollId, optionId }` | Submit a vote |
| `pollUpdated` | Server → Clients | `poll` | Broadcast updated poll data |
| `error` | Server → Client | `{ message }` | Error notifications |

## 🚢 Deployment

### Environment Variables

```env
# Backend (.env)
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

### Production Considerations

1. **Database**: Use MongoDB Atlas or a managed database service
2. **CORS**: Update `cors` configuration in `server.js` for production domain
3. **Environment**: Set `NODE_ENV=production`
4. **Scaling**: Consider Redis for Socket.io adapter in multi-instance deployments
5. **Static Files**: Serve frontend build from backend or use CDN

### Deployment Options

- **Backend**: Heroku, Railway, Render, AWS EC2
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Full-Stack**: Deploy both on the same server or use separate services with proxy

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📧 Support

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ using modern web technologies**
