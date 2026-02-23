const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const QRCode = require('qrcode');
const Ticket = require('../models/Ticket');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/events
 * @desc    Create a new event (Organizer only)
 * @access  Organizer
 */
router.post('/', checkRole(['Organizer']), async (req, res) => {
    try {
        const { name, description, type, startDate, endDate, registrationDeadline, tags, formFields, maxParticipants, price, stock, isTeamEvent, minTeamSize, maxTeamSize, eligibility } = req.body;

        // Validation
        if (!name || !description || !startDate || !endDate || !registrationDeadline) {
            return res.status(400).json({
                error: 'Please provide name, description, startDate, endDate, and registrationDeadline'
            });
        }

        // Validate formFields structure if provided
        if (formFields && Array.isArray(formFields)) {
            for (const field of formFields) {
                if (!field.label || !field.fieldType) {
                    return res.status(400).json({
                        error: 'Each form field must have a label and fieldType'
                    });
                }

                // Generate fieldName from label if not provided
                if (!field.fieldName) {
                    field.fieldName = field.label
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '_')
                        .replace(/^_|_$/g, '');
                }

                // Validate that select/radio/checkbox have options
                if (['select', 'radio', 'checkbox'].includes(field.fieldType)) {
                    if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
                        return res.status(400).json({
                            error: `Field "${field.label}" requires options array`
                        });
                    }
                }
            }
        }

        // Logical date validation
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }
        if (new Date(registrationDeadline) > new Date(startDate)) {
            return res.status(400).json({ error: 'Registration deadline cannot be after start date' });
        }

        // Create event
        const event = new Event({
            name,
            description,
            type: type || 'Normal',
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            registrationDeadline: new Date(registrationDeadline),
            tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
            organizerId: req.user.userId,
            formFields: formFields || [],
            maxParticipants: maxParticipants || null,
            price: price || 0,
            stock: stock !== undefined ? stock : null,
            isTeamEvent: isTeamEvent || false,
            minTeamSize: minTeamSize || 1,
            maxTeamSize: maxTeamSize || 1,
            maxTeams: req.body.maxTeams || null,
            eligibility: eligibility || 'All',
            status: 'Draft'
        });

        await event.save();

        res.status(201).json({
            message: 'Event created successfully',
            event
        });

    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/events
 * @desc    Get all events (filtered by role)
 * @access  Authenticated users
 */
router.get('/', async (req, res) => {
    try {
        let query = {};

        // Organizers see only their events
        if (req.user.role === 'Organizer') {
            query.organizerId = req.user.userId;
        }

        // Participants see only published events
        if (req.user.role === 'Participant') {
            query.status = 'Published';
        }

        // Admins see all events (no filter)

        const events = await Event.find(query)
            .populate('organizerId', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            events,
            count: events.length
        });

    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/events/my-registrations
 * @desc    Get all events the user has registered for
 * @access  Participant
 */
router.get('/my-registrations', checkRole(['Participant']), async (req, res) => {
    try {
        const Ticket = require('../models/Ticket');

        const tickets = await Ticket.find({
            userId: req.user.userId
        })
            .populate('eventId')
            .populate('teamId')
            .sort({ registeredAt: -1 });

        res.json({
            tickets,
            count: tickets.length
        });

    } catch (error) {
        console.error('Get registrations error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/events/:id
 * @desc    Get a single event by ID
 * @access  Authenticated users
 */
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizerId', 'name email')
            .populate('participants', 'name email');

        if (!event) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }

        // Check permissions
        if (req.user.role === 'Organizer' && event.organizerId._id.toString() !== req.user.userId) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only view your own events'
            });
        }

        if (req.user.role === 'Participant' && event.status !== 'Published') {
            return res.status(403).json({
                error: 'Access denied',
                message: 'This event is not published yet'
            });
        }

        let teamsCount = 0;
        if (event.isTeamEvent) {
            const Team = require('../models/Team');
            teamsCount = await Team.countDocuments({ eventId: event._id });
        }

        const participantsCount = event.participants ? event.participants.length : 0;
        res.json({ event, teamsCount, participantsCount });

    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

/**
 * @route   PUT /api/events/:id
 * @desc    Update an event (only if Draft)
 * @access  Organizer (owner only)
 */
router.put('/:id', checkRole(['Organizer']), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }

        // Check ownership
        if (event.organizerId.toString() !== req.user.userId) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only update your own events'
            });
        }

        // Check if form fields can be edited (locked after first registration)
        const hasRegistrations = event.participants && event.participants.length > 0;
        const { name, description, type, startDate, endDate, registrationDeadline, tags, formFields, maxParticipants, price, stock, status, isTeamEvent, minTeamSize, maxTeamSize, maxTeams, eligibility } = req.body;

        if (hasRegistrations && formFields) {
            return res.status(400).json({
                error: 'Cannot update form fields',
                message: 'Form fields are locked after the first registration is received'
            });
        }

        // Apply editing rules based on status
        if (event.status === 'Draft') {
            // Free edits allowed
            if (name) event.name = name;
            if (description) event.description = description;
            if (type) event.type = type;
            if (startDate) event.startDate = new Date(startDate);
            if (endDate) event.endDate = new Date(endDate);
            if (registrationDeadline) event.registrationDeadline = new Date(registrationDeadline);
            if (tags) event.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
            if (formFields) event.formFields = formFields;
            if (maxParticipants !== undefined) event.maxParticipants = maxParticipants;
            if (price !== undefined) event.price = price;
            if (stock !== undefined) event.stock = stock;
            if (isTeamEvent !== undefined) event.isTeamEvent = isTeamEvent;
            if (minTeamSize !== undefined) event.minTeamSize = minTeamSize;
            if (maxTeamSize !== undefined) event.maxTeamSize = maxTeamSize;
            if (maxTeams !== undefined) event.maxTeams = maxTeams;
            if (eligibility) event.eligibility = eligibility;
        } else if (event.status === 'Published') {
            // Limited edits: description, deadline (date), limit (maxParticipants), stock
            if (description) event.description = description;
            if (registrationDeadline) {
                event.registrationDeadline = new Date(registrationDeadline);
            }
            if (startDate) event.startDate = new Date(startDate);
            if (endDate) event.endDate = new Date(endDate);
            if (maxParticipants !== undefined) event.maxParticipants = maxParticipants;
            if (stock !== undefined) event.stock = stock;
            if (maxTeams !== undefined) event.maxTeams = maxTeams;
        } else if (['Ongoing', 'Completed', 'Closed'].includes(event.status)) {
            // No edits except status change
            if (name || description || startDate || endDate || registrationDeadline || formFields || maxParticipants || price || stock) {
                return res.status(400).json({
                    error: 'Cannot update event details',
                    message: `Event is already ${event.status}. Only status can be changed.`
                });
            }
        }

        // Always allow status change if valid
        if (status && event.status !== status) {
            const validTransitions = {
                'Draft': ['Published'],
                'Published': ['Ongoing', 'Closed', 'Cancelled'],
                'Ongoing': ['Completed', 'Cancelled'],
                'Closed': ['Published', 'Ongoing', 'Cancelled'],
                'Completed': [],
                'Cancelled': []
            };

            if (validTransitions[event.status]?.includes(status)) {
                event.status = status;
            } else if (req.user.role === 'Admin') {
                // Admin can override status
                event.status = status;
            } else {
                return res.status(400).json({
                    error: 'Invalid status transition',
                    message: `Cannot change status from ${event.status} to ${status}`
                });
            }
        }

        await event.save();

        res.json({
            message: 'Event updated successfully',
            event
        });

    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete an event
 * @access  Organizer (owner only)
 */
router.delete('/:id', checkRole(['Organizer']), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }

        // Check ownership
        if (event.organizerId.toString() !== req.user.userId) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only delete your own events'
            });
        }

        // Allow deleting published events too, but clean up tickets
        const Ticket = require('../models/Ticket');

        // Delete all tickets associated with this event
        await Ticket.deleteMany({ eventId: event._id });

        // Delete the event
        await Event.findByIdAndDelete(req.params.id);

        res.json({
            message: 'Event and associated registrations deleted successfully',
            deletedEvent: {
                id: event._id,
                name: event.name
            }
        });

    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

/**
 * @route   POST /api/events/:id/cancel
 * @desc    Cancel registration for an event
 * @access  Participant
 */
router.post('/:id/cancel', checkRole(['Participant']), async (req, res) => {
    try {
        const Ticket = require('../models/Ticket');
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }

        // Find the registration
        const ticket = await Ticket.findOne({
            userId: req.user.userId,
            eventId: event._id,
            status: 'Confirmed'
        });

        if (!ticket) {
            return res.status(404).json({
                error: 'Registration not found',
                message: 'You are not registered for this event'
            });
        }

        // Update ticket status to Cancelled
        ticket.status = 'Cancelled';
        await ticket.save();

        // Increment stock back for merchandise
        if (event.type === 'Merch' && event.stock !== null) {
            await Event.findByIdAndUpdate(
                event._id,
                { $inc: { stock: 1 } }
            );
        }

        // Send Cancellation Email
        const User = require('../models/User');
        const user = await User.findById(req.user.userId);
        const sendEmail = require('../utils/emailService');

        const cancelSubject = `Registration Cancelled - ${event.name}`;
        const cancelText = `Hello ${user.name},\n\nYour registration for ${event.name} has been successfully cancelled.\n\nTicket ID: ${ticket._id}\n\nBest regards,\nEvent Management Team`;
        const cancelHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e74c3c;">Registration Cancelled</h2>
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>Your registration for <strong>${event.name}</strong> has been successfully <strong>cancelled</strong>.</p>
                <div style="background: #fdf2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #e74c3c;">
                    <p><strong>Event:</strong> ${event.name}</p>
                    <p><strong>Date:</strong> ${event.startDate ? new Date(event.startDate).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Ticket ID:</strong> ${ticket._id}</p>
                    <p><strong>Status:</strong> Cancelled</p>
                </div>
                <p>We hope to see you at future events!</p>
                <p>Best regards,<br>Event Management Team</p>
                <hr>
                <p style="font-size: 12px; color: #888;">This is an automated email. Please do not reply.</p>
            </div>
        `;

        sendEmail(user.email, cancelSubject, cancelText, cancelHtml);

        res.json({
            message: 'Registration cancelled successfully',
            ticketId: ticket._id
        });

    } catch (error) {
        console.error('Cancel registration error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

/**
 * @route   PATCH /api/events/:id/publish
 * @desc    Publish a draft event
 * @access  Organizer (owner only)
 */
router.patch('/:id/publish', checkRole(['Organizer']), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }

        // Check ownership
        if (event.organizerId.toString() !== req.user.userId) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only publish your own events'
            });
        }

        // Only allow publishing if event is in Draft status
        if (event.status !== 'Draft') {
            return res.status(400).json({
                error: 'Cannot publish event',
                message: 'Only events in Draft status can be published'
            });
        }

        event.status = 'Published';
        await event.save();

        // Get organizer's Discord Webhook URL
        const User = require('../models/User');
        const organizer = await User.findById(req.user.userId);

        if (organizer && organizer.discordWebhook) {
            const { sendEventNotification } = require('../utils/discordService');
            sendEventNotification(organizer.discordWebhook, event);
        }

        res.json({
            message: 'Event published successfully',
            event
        });

    } catch (error) {
        console.error('Publish event error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

/**
 * @route   POST /api/events/:id/register
 * @desc    Register for an event
 * @access  Participant
 */
router.post('/:id/register', checkRole(['Participant']), async (req, res) => {
    try {
        const Ticket = require('../models/Ticket');
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }

        // Check if event is published
        if (event.status !== 'Published') {
            return res.status(400).json({
                error: 'Cannot register',
                message: 'This event is not published yet'
            });
        }

        // Check if registration deadline has passed
        const now = new Date();
        if (event.registrationDeadline < now) {
            return res.status(400).json({
                error: 'Registration closed',
                message: 'The registration deadline for this event has passed'
            });
        }

        // Check if event capacity is full
        if (event.maxParticipants) {
            const registrationCount = await Ticket.countDocuments({
                eventId: event._id,
                status: 'Confirmed'
            });

            if (registrationCount >= event.maxParticipants) {
                return res.status(400).json({
                    error: 'Event full',
                    message: 'This event has reached its maximum capacity'
                });
            }
        }

        // Check if user already registered
        const existingTicket = await Ticket.findOne({
            userId: req.user.userId,
            eventId: event._id
        });

        if (existingTicket) {
            return res.status(400).json({
                error: 'Already registered',
                message: 'You have already registered for this event'
            });
        }

        // Validate form field answers
        const { answers } = req.body;

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Please provide answers array'
            });
        }

        // Validate that all required fields are answered
        for (const field of event.formFields) {
            if (field.required) {
                const answer = answers.find(a => a.label === field.label);
                if (!answer || !answer.value) {
                    return res.status(400).json({
                        error: 'Missing required field',
                        message: `Please answer: ${field.label}`
                    });
                }
            }
        }

        // Check stock for merchandise events
        if (event.type === 'Merch' && event.stock !== null) {
            if (event.stock <= 0) {
                return res.status(400).json({
                    error: 'Out of stock',
                    message: 'This merchandise is currently out of stock'
                });
            }
        }

        // Create ticket
        const ticket = new Ticket({
            userId: req.user.userId,
            eventId: event._id,
            answers,
            status: 'Confirmed'
        });

        await ticket.save();

        // Decrement stock atomically for merchandise (after ticket is created successfully)
        if (event.type === 'Merch' && event.stock !== null) {
            await Event.findByIdAndUpdate(
                event._id,
                { $inc: { stock: -1 } }
            );
        }

        // Send Email Notification
        const User = require('../models/User');
        const user = await User.findById(req.user.userId);
        const sendEmail = require('../utils/emailService');

        const isMerch = event.type === 'Merch';
        const actionWord = isMerch ? 'purchased' : 'registered for';
        const actionTitle = isMerch ? 'Purchase Confirmed' : 'Registration Confirmed';

        const emailSubject = `${actionTitle} - ${event.name}`;
        const emailText = `Hello ${user.name},\n\nYou have successfully ${actionWord} ${event.name}.\nDate: ${event.startDate ? new Date(event.startDate).toLocaleDateString() : 'N/A'}\nStatus: Confirmed\n\nTicket ID: ${ticket._id}\n\nPlease show your QR code/Ticket ID from the dashboard for verification.\n\nBest regards,\nEvent Management Team`;

        // Generate QR Code
        let qrCodeBuffer;
        try {
            qrCodeBuffer = await QRCode.toBuffer(ticket._id.toString(), {
                errorCorrectionLevel: 'H',
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                },
                width: 300
            });
        } catch (qrError) {
            console.error('QR Generation Error:', qrError);
        }

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background: #4a90e2; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">${actionTitle}!</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
                    <p>Hello <strong>${user.name}</strong>,</p>
                    <p>You have successfully ${actionWord} <strong>${event.name}</strong>.</p>
                    
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
                        <h3 style="margin-top: 0; color: #4a90e2;">Ticket Details</h3>
                        <p><strong>Event:</strong> ${event.name}</p>
                        <p><strong>Date:</strong> ${event.startDate ? new Date(event.startDate).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Status:</strong> <span style="color: #27ae60; font-weight: bold;">Confirmed</span></p>
                        <p><strong>Ticket ID:</strong> ${ticket._id}</p>
                    </div>

                    ${qrCodeBuffer ? `
                    <div style="text-align: center; margin: 30px 0;">
                        <p style="font-weight: bold; margin-bottom: 10px;">Your Entry QR Code:</p>
                        <img src="cid:ticket_qr" alt="Ticket QR Code" style="width: 200px; height: 200px; border: 1px solid #ddd; padding: 10px; border-radius: 10px;" />
                        <p style="font-size: 12px; color: #666; margin-top: 10px;">Please show this QR code at the event entrance for verification.</p>
                    </div>
                    ` : '<p style="color: #e74c3c; text-align: center;">Note: QR code generation failed. Please use your Ticket ID for verification.</p>'}

                    <p style="margin-top: 30px;">Best regards,<br><strong>Felicity Event Management Team</strong></p>
                </div>
                <div style="text-align: center; padding: 20px; font-size: 12px; color: #888;">
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        `;

        const attachments = qrCodeBuffer ? [{
            filename: 'ticket_qr.png',
            content: qrCodeBuffer,
            content_type: 'image/png',
            content_id: 'ticket_qr'
        }] : [];

        // Send asynchronously (don't block response)
        sendEmail(user.email, emailSubject, emailText, emailHtml, attachments);

        res.status(201).json({
            message: 'Registration successful',
            ticket: {
                id: ticket._id,
                eventId: event._id,
                eventName: event.name,
                status: ticket.status,
                registeredAt: ticket.registeredAt
            }
        });

    } catch (error) {
        console.error('Registration error:', error);

        // Handle duplicate registration error from unique index
        if (error.code === 11000) {
            return res.status(400).json({
                error: 'Already registered',
                message: 'You have already registered for this event'
            });
        }

        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});



/**
 * @route   GET /api/events/:id/participants
 * @desc    Get all participants for an event (Organizer only)
 * @access  Organizer (owner only)
 */
router.get('/:id/participants', checkRole(['Organizer']), async (req, res) => {
    try {
        const Ticket = require('../models/Ticket');
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }

        // Check ownership
        if (event.organizerId.toString() !== req.user.userId) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only view participants for your own events'
            });
        }

        // Get all tickets for this event
        const tickets = await Ticket.find({
            eventId: event._id
        })
            .populate('userId', 'name email')
            .sort({ registeredAt: -1 });

        // Format the response
        const participants = tickets.map(ticket => ({
            ticketId: ticket._id,
            user: {
                name: ticket.userId?.name || 'Unknown',
                email: ticket.userId?.email || 'Unknown'
            },
            answers: ticket.answers,
            status: ticket.status,
            checkedIn: ticket.checkedIn,
            registeredAt: ticket.registeredAt
        }));

        res.json({
            participants,
            count: participants.length,
            eventName: event.name,
            maxParticipants: event.maxParticipants
        });

    } catch (error) {
        console.error('Get participants error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/events/:id/analytics
 * @desc    Get detailed analytics for an event
 * @access  Organizer (owner only)
 */
router.get('/:id/analytics', checkRole(['Organizer']), async (req, res) => {
    try {
        const Ticket = require('../models/Ticket');
        const event = await Event.findById(req.params.id);

        if (!event) return res.status(404).json({ error: 'Event not found' });
        if (event.organizerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const tickets = await Ticket.find({ eventId: event._id });

        const totalRegistrations = tickets.filter(t => t.status === 'Confirmed').length;
        const totalRevenue = event.price ? totalRegistrations * event.price : 0;
        const totalAttendance = tickets.filter(t => t.checkedIn).length;

        // Team completion stats if applicable
        let teamStats = null;
        if (event.isTeamEvent) {
            const Team = require('../models/Team');
            const totalTeams = await Team.countDocuments({ eventId: event._id });
            const completedTeams = await Team.countDocuments({ eventId: event._id, status: 'Completed' }); // Assuming 'Completed' means full
            teamStats = { totalTeams, completedTeams };
        }

        // Registration trend (registrations per day for last 7 days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            last7Days.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: tickets.filter(t => {
                    const regDate = new Date(t.registeredAt);
                    return regDate.toDateString() === date.toDateString();
                }).length
            });
        }

        res.json({
            overview: {
                totalRegistrations,
                totalRevenue,
                totalAttendance,
                capacity: event.maxParticipants,
                attendanceRate: totalRegistrations > 0 ? (totalAttendance / totalRegistrations * 100).toFixed(1) : 0
            },
            teamStats,
            registrationTrend: last7Days,
            eventName: event.name,
            status: event.status
        });

    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

const Feedback = require('../models/Feedback');

/**
 * @route   POST /api/events/:id/feedback
 * @desc    Submit anonymous feedback for an event
 * @access  Participant
 */
router.post('/:id/feedback', authMiddleware, checkRole(['Participant']), async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const eventId = req.params.id;
        const userId = req.user.userId;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Fetch event to check status
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event.status !== 'Completed') {
            return res.status(400).json({
                error: 'Feedback not allowed',
                message: 'Feedback can only be submitted for completed events.'
            });
        }

        // Check if user has a CHECKED-IN ticket
        const ticket = await Ticket.findOne({
            userId,
            eventId,
            status: 'Confirmed',
            checkedIn: true
        });

        if (!ticket) {
            return res.status(403).json({
                error: 'Not authorized',
                message: 'You must attend (check-in) the event to leave feedback.'
            });
        }

        if (ticket.feedbackGiven) {
            return res.status(400).json({ error: 'Feedback already submitted for this event' });
        }

        // Create Anonymous Feedback
        const feedback = new Feedback({
            eventId,
            rating,
            comment
        });

        await feedback.save();

        // Mark ticket as feedback given
        ticket.feedbackGiven = true;
        await ticket.save();

        res.status(201).json({ message: 'Feedback submitted successfully' });

    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/events/:id/feedback
 * @desc    Get aggregated feedback for an event
 * @access  Organizer
 */
router.get('/:id/feedback', authMiddleware, checkRole(['Organizer']), async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.userId;

        // Verify ownership
        const event = await Event.findOne({ _id: eventId, organizerId: userId });
        if (!event) {
            return res.status(404).json({ error: 'Event not found or unauthorized' });
        }

        const feedbacks = await Feedback.find({ eventId }).sort({ createdAt: -1 });

        // Calculate statistics
        const total = feedbacks.length;
        const sum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
        const average = total > 0 ? (sum / total).toFixed(1) : 0;

        const distribution = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        };
        feedbacks.forEach(f => distribution[f.rating]++);

        res.json({
            total,
            average,
            distribution,
            feedbacks // List of comments
        });

    } catch (error) {
        console.error('Get feedback error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
