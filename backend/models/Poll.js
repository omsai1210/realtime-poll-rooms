const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    question: {
        type: String,
        required: true
    },
    options: [{
        text: {
            type: String,
            required: true
        },
        voteCount: {
            type: Number,
            default: 0
        },
        votes: [{
            username: {
                type: String,
                required: true
            },
            votedAt: {
                type: Date,
                default: Date.now
            }
        }]
    }],
    voters: [{
        username: {
            type: String,
            required: true
        },
        currentVote: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Poll.options'
        },
        votedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Poll', pollSchema);
