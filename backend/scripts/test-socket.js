const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:5000';
const POLL_ID = 'test-poll-1'; // Ensure this exists in your DB for the test to pass completely
const OPTION_ID = '699322e33bd647da5a21459e'; // Real option ID form DB

const client1 = io(SOCKET_URL);
const client2 = io(SOCKET_URL);

console.log('Starting verification...');

client1.on('connect', () => {
    console.log('Client 1 connected');
    client1.emit('joinPoll', POLL_ID);
});

client2.on('connect', () => {
    console.log('Client 2 connected');
    client2.emit('joinPoll', POLL_ID);
});

client1.on('pollUpdated', (poll) => {
    console.log('Client 1 received pollUpdated:', poll.id);
});

client2.on('pollUpdated', (poll) => {
    console.log('Client 2 received pollUpdated:', poll.id);
    console.log('Test Passed: Real-time update received');
    process.exit(0);
});

// Simulate a vote after a short delay
setTimeout(() => {
    console.log('Client 1 voting...');
    // Note: This will fail on the server if the poll/option doesn't exist, 
    // but we should still see the error message if handled correctly.
    client1.emit('vote', { pollId: POLL_ID, optionId: OPTION_ID });
}, 1000);

// Timeout if no response
setTimeout(() => {
    console.log('Test Failed: Timeout waiting for updates');
    process.exit(1);
}, 5000);
