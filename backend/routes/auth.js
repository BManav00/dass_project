const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');

// IIIT email validation regex
const IIIT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*iiit\.ac\.in$/i;

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, isIIIT, metadata } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Please provide name, email, and password'
            });
        }

        // Check password length
        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }

        const normalizedEmail = email.toLowerCase();
        let finalMetadata = metadata || {};

        if (isIIIT) {
            // IIIT Validation
            if (!IIIT_EMAIL_REGEX.test(normalizedEmail)) {
                return res.status(400).json({
                    error: 'Invalid email domain',
                    message: 'Only IIIT email addresses (@iiit.ac.in) are allowed for IIIT Student registration'
                });
            }

            // IIIT students must have unique emails
            const existingUser = await User.findOne({ email: normalizedEmail });
            if (existingUser) {
                return res.status(400).json({
                    error: 'Email already registered',
                    message: 'A user with this email already exists'
                });
            }
        } else {
            // Guest Validation
            // Guests can share emails, BUT passwords must be unique for that email (to distinguish identity)
            const existingUsers = await User.find({ email: normalizedEmail });

            if (existingUsers.length > 0) {
                // Check if the new password collides with any existing password for this email
                for (const user of existingUsers) {
                    const isMatch = await comparePassword(password, user.password);
                    if (isMatch) {
                        return res.status(400).json({
                            error: 'Password already in use',
                            message: 'This password is already associated with an account using this email. Please use a different password to create a distinct identity.'
                        });
                    }
                }
            }
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create new user
        const user = new User({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: 'Participant',
            isIIIT: !!isIIIT,
            metadata: finalMetadata
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id, user.email, user.role);

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isIIIT: user.isIIIT,
                metadata: user.metadata
            },
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Server error during registration',
            message: error.message
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                error: 'Please provide email and password'
            });
        }

        // Find ALL users by email (since multiple guests can share email)
        const users = await User.find({ email: email.toLowerCase() });

        if (users.length === 0) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        // Iterate to find the correct user instance
        let authenticatedUser = null;

        for (const user of users) {
            const isMatch = await comparePassword(password, user.password);
            if (isMatch) {
                authenticatedUser = user;
                break;
            }
        }

        if (!authenticatedUser) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        // Generate token
        const token = generateToken(authenticatedUser._id, authenticatedUser.email, authenticatedUser.role);

        // Return user info
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: authenticatedUser._id,
                name: authenticatedUser.name,
                email: authenticatedUser.email,
                role: authenticatedUser.role,
                isIIIT: authenticatedUser.isIIIT,
                metadata: authenticatedUser.metadata
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Server error during login',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info (requires authentication)
 * @access  Private
 */
router.get('/me', require('../middleware/authMiddleware'), async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isIIIT: user.isIIIT,
                metadata: user.metadata
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

module.exports = router;
