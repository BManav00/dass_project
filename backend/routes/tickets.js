const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/tickets/scan
 * @desc    Scan a ticket QR code (Organizer only)
 * @access  Organizer
 */
router.post('/scan', checkRole(['Organizer']), async (req, res) => {
    try {
        const { ticketId } = req.body;

        if (!ticketId) {
            return res.status(400).json({ error: 'Ticket ID is required' });
        }

        const ticket = await Ticket.findById(ticketId).populate('eventId');

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Verify that the organizer owns the event
        const event = ticket.eventId;
        if (event.organizerId.toString() !== req.user.userId) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only scan tickets for your own events'
            });
        }

        if (ticket.status !== 'Confirmed') {
            return res.status(400).json({
                error: 'Invalid ticket',
                message: `This ticket is ${ticket.status}`
            });
        }

        if (ticket.checkedIn) {
            return res.status(400).json({
                error: 'Already scanned',
                message: 'This ticket has already been used'
            });
        }

        // Mark as checked in
        ticket.checkedIn = true;
        ticket.checkInTime = new Date();
        await ticket.save();

        res.json({
            message: 'Check-in successful',
            ticket: {
                id: ticket._id,
                user: ticket.userId, // We might want to populate user name here
                checkedIn: ticket.checkedIn,
                checkInTime: ticket.checkInTime
            }
        });

    } catch (error) {
        console.error('Scan ticket error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/tickets/:id
 * @desc    Get ticket details
 * @access  Organizer or Ticket Owner
 */
router.get('/:id', async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('eventId')
            .populate('userId', 'name email');

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Check permissions: Owner or Event Organizer
        const isOwner = ticket.userId._id.toString() === req.user.userId;
        const isOrganizer = ticket.eventId.organizerId.toString() === req.user.userId;

        if (!isOwner && !isOrganizer) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ ticket });

    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
