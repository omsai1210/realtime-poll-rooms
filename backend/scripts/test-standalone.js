const { MongoMemoryServer } = require('mongodb-memory-server');
const io = require('socket.io-client');
const axios = require('axios');
const http = require('http');

let mongod;
let server;

async function setup() {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    process.env.MONGO_URI = uri;
    process.env.PORT = 5001; // Use different port for test

    // Require server.js which will start listening
    // Note: Since server.js starts automatically on require, we rely on that.
    // Ideally, server.js would export the app/server to be started manually,
    // but for this quick test, running it as a side-effect is acceptable 
    // if we ensure environment is set first.

    console.log('Starting server with in-memory DB...');
    require('../server');

    // Give it a moment to connect
    await new Promise(resolve => setTimeout(resolve, 2000));
}

async function test() {
    const SOCKET_URL = 'http://localhost:5001';
    const API_URL = 'http://localhost:5001/api/polls';

    try {
        // 1. Create poll
        console.log('Creating poll...');
        const createRes = await axios.post(API_URL, {
            question: 'Memory Test',
            options: ['A', 'B']
        });
        const pollId = createRes.data.id;
        console.log(`Poll created: ${pollId}`);

        // Get option ID
        const pollRes = await axios.get(`${API_URL}/${pollId}`);
        const optionId = pollRes.data.options[0]._id;
        console.log(`Option ID: ${optionId}`);

        // 2. socket test
        const socket = io(SOCKET_URL);

        return new Promise((resolve, reject) => {
            socket.on('connect', () => {
                console.log('Socket connected');
                socket.emit('joinPoll', pollId);
                socket.emit('vote', { pollId, optionId });
            });

            socket.on('pollUpdated', (poll) => {
                console.log('Poll updated received');
                if (poll.options.find(o => o._id === optionId).voteCount === 1) {
                    console.log('SUCCESS: Vote counted');
                    resolve();
                } else {
                    reject(new Error('Vote count incorrect'));
                }
                socket.disconnect();
            });

            socket.on('error', (err) => {
                console.error('Socket error', err);
                reject(err);
            });

            // Timeout
            setTimeout(() => {
                reject(new Error('Timeout waiting for update'));
            }, 5000);
        });

    } catch (err) {
        console.error('Test error:', err.message);
        if (err.response) {
            console.error('Response status:', err.response.status);
            console.error('Response data:', err.response.data);
        }
        throw err;
    }
}

setup()
    .then(() => test())
    .then(() => {
        console.log('Test PASSED');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Test FAILED', err);
        process.exit(1);
    });
