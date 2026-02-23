const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const { hashPassword } = require('../utils/auth');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password')
            .populate('followedClubs', 'name email');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', async (req, res) => {
    try {
        const {
            firstName, lastName, contactNumber, college, interests,
            category, description, name // Organizer Name can be passed as 'name'
        } = req.body;

        const updates = {};

        if (req.user.role === 'Participant') {
            updates.firstName = firstName;
            updates.lastName = lastName;
            updates.contactNumber = contactNumber;
            updates.college = college;
            updates.interests = interests;
            updates.name = `${firstName} ${lastName}`.trim();
        } else if (req.user.role === 'Organizer') {
            updates.name = name;
            updates.category = category;
            updates.description = description;
            updates.contactNumber = contactNumber;
            updates.contactEmail = req.body.contactEmail;
            updates.discordWebhook = req.body.discordWebhook;
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
        ).select('-password');

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

/**
 * @route   POST /api/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.userId);

        const { comparePassword } = require('../utils/auth');
        const isMatch = await comparePassword(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid current password' });
        }

        user.password = await hashPassword(newPassword);
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/users/organizers
 * @desc    Get all organizers (clubs) for participants to follow
 * @access  Participant
 */
router.get('/organizers', checkRole(['Participant', 'Admin']), async (req, res) => {
    try {
        const organizers = await User.find({ role: 'Organizer' })
            .select('name email metadata firstName lastName');
        res.json(organizers);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/users/organizers/:id
 * @desc    Get organizer details and their events
 * @access  Private
 */
router.get('/organizers/:id', async (req, res) => {
    try {
        const organizer = await User.findById(req.params.id)
            .select('name email metadata firstName lastName');

        if (!organizer || organizer.role !== 'Organizer') {
            return res.status(404).json({ error: 'Organizer not found' });
        }

        const events = await Event.find({ organizerId: organizer._id, status: 'Published' })
            .sort({ date: 1 });

        res.json({ organizer, events });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   POST /api/users/follow/:id
 * @desc    Follow/Unfollow an organizer
 * @access  Participant
 */
router.post('/follow/:id', checkRole(['Participant']), async (req, res) => {
    try {
        const organizerId = req.params.id;
        const user = await User.findById(req.user.userId);

        const isFollowing = user.followedClubs.includes(organizerId);

        if (isFollowing) {
            user.followedClubs = user.followedClubs.filter(id => id.toString() !== organizerId);
        } else {
            user.followedClubs.push(organizerId);
        }

        await user.save();
        res.json({
            message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
            isFollowing: !isFollowing
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/users/trending-events
 * @desc    Get top 5 events registered in last 24h
 * @access  Private
 */
router.get('/trending-events', async (req, res) => {
    try {
        const transitionDate = new Date();
        transitionDate.setHours(transitionDate.getHours() - 24);

        // Aggregate tickets to find most popular events in last 24h
        const trendingData = await Ticket.aggregate([
            { $match: { createdAt: { $gte: transitionDate }, status: 'Confirmed' } },
            { $group: { _id: '$eventId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const eventIds = trendingData.map(t => t._id);
        const events = await Event.find({ _id: { $in: eventIds }, status: 'Published' })
            .populate('organizerId', 'name');

        res.json(events);
    } catch (error) {
        console.error('Trending events error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
