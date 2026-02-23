const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { hashPassword } = require('../utils/auth');
const { generatePassword } = require('../utils/passwordGenerator');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// All routes require admin authentication
router.use(authMiddleware);
router.use(checkRole(['Admin']));

/**
 * @route   POST /api/admin/organizers
 * @desc    Create a new organizer account
 * @access  Admin only
 */
router.post('/organizers', async (req, res) => {
    try {
        const { name, email, metadata } = req.body;

        // Validation
        if (!name || !email) {
            return res.status(400).json({
                error: 'Please provide name and email'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                error: 'Email already registered',
                message: 'A user with this email already exists'
            });
        }

        // Generate random password
        const generatedPassword = generatePassword(12);
        const hashedPassword = await hashPassword(generatedPassword);

        // Create organizer
        const organizer = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'Organizer',
            metadata: metadata || {}
        });

        await organizer.save();

        // Log password to console for admin
        console.log('\n' + '='.repeat(60));
        console.log('🔑 NEW ORGANIZER CREATED');
        console.log('='.repeat(60));
        console.log('Name:', name);
        console.log('Email:', email);
        console.log('Password:', generatedPassword);
        console.log('Role: Organizer');
        console.log('='.repeat(60) + '\n');

        // Return organizer info and password
        res.status(201).json({
            message: 'Organizer created successfully',
            organizer: {
                id: organizer._id,
                name: organizer.name,
                email: organizer.email,
                role: organizer.role,
                metadata: organizer.metadata,
                createdAt: organizer.createdAt
            },
            password: generatedPassword
        });

    } catch (error) {
        console.error('Create organizer error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/admin/organizers
 * @desc    Get all organizers
 * @access  Admin only
 */
router.get('/organizers', async (req, res) => {
    try {
        const organizers = await User.find({ role: 'Organizer' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            organizers,
            count: organizers.length
        });

    } catch (error) {
        console.error('Get organizers error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

/**
 * @route   DELETE /api/admin/organizers/:id
 * @desc    Delete an organizer
 * @access  Admin only
 */
router.delete('/organizers/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Find user
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                error: 'Organizer not found'
            });
        }

        // Verify it's an organizer
        if (user.role !== 'Organizer') {
            return res.status(400).json({
                error: 'Cannot delete non-organizer users',
                message: 'This endpoint can only delete users with Organizer role'
            });
        }

        await User.findByIdAndDelete(id);

        res.json({
            message: 'Organizer deleted successfully',
            deletedOrganizer: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Delete organizer error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin statistics
 * @access  Admin only
 */
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const participants = await User.countDocuments({ role: 'Participant' });
        const organizers = await User.countDocuments({ role: 'Organizer' });
        const admins = await User.countDocuments({ role: 'Admin' });

        res.json({
            stats: {
                totalUsers,
                participants,
                organizers,
                admins
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

module.exports = router;
