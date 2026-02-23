const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware');

// Get chat history for a room
// GET /api/messages/:roomId
router.get('/:roomId', authMiddleware, async (req, res) => {
    try {
        const { roomId } = req.params;

        // Fetch last 50 messages
        const messages = await Message.find({ roomId })
            .sort({ timestamp: 1 }) // Oldest first
            .limit(100);

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
