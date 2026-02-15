const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const Poll = require('../models/Poll');

// POST /api/polls
router.post('/', async (req, res) => {
    const { question, options } = req.body;

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ error: 'Question and at least 2 options are required.' });
    }

    try {
        const newPoll = new Poll({
            id: nanoid(10),
            question,
            options: options.map(opt => ({ text: opt, voteCount: 0 }))
        });

        await newPoll.save();
        res.status(201).json({ id: newPoll.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error creating poll.' });
    }
});

// GET /api/polls/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const poll = await Poll.findOne({ id });

        if (!poll) {
            return res.status(404).json({ error: 'Poll not found.' });
        }

        res.json(poll);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching poll.' });
    }
});

module.exports = router;
