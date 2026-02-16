const mongoose = require('mongoose');
const Poll = require('../models/Poll');
require('dotenv').config({ path: '../.env' });

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/poll-rooms';

mongoose.connect(mongoUri)
    .then(async () => {
        console.log('Connected to MongoDB for seeding');

        // Check if poll exists
        const existingPoll = await Poll.findOne({ id: 'test-poll-1' });
        if (existingPoll) {
            console.log('Test poll already exists');
        } else {
            const newPoll = new Poll({
                id: 'test-poll-1',
                question: 'What is your favorite color?',
                options: [
                    { text: 'Red', voteCount: 0 },
                    { text: 'Blue', voteCount: 0 }
                ]
            });
            await newPoll.save();
            console.log('Test poll created');
        }

        // Print option IDs for the test script
        const poll = await Poll.findOne({ id: 'test-poll-1' });
        console.log('Option ID for Red:', poll.options[0]._id);

        process.exit(0);
    })
    .catch(err => {
        console.error('Seeding error:', err);
        process.exit(1);
    });
