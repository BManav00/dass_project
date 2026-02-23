const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Helper to generate unique code
const generateTeamCode = async () => {
    let code;
    let isUnique = false;
    while (!isUnique) {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const existing = await Team.findOne({ code });
        if (!existing) isUnique = true;
    }
    return code;
};

/**
 * @route   POST /api/teams/create
 * @desc    Create a new team for an event
 * @access  Participant
 */
router.post('/create', checkRole(['Participant']), async (req, res) => {
    try {
        const { name, eventId } = req.body;

        if (!name || !eventId) {
            return res.status(400).json({ error: 'Name and Event ID are required' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (!event.isTeamEvent) {
            return res.status(400).json({ error: 'This is not a team event' });
        }

        // Check if already in a team for this event
        const existingTeam = await Team.findOne({
            eventId,
            $or: [{ leaderId: req.user.userId }, { members: req.user.userId }]
        });

        if (existingTeam) {
            return res.status(400).json({ error: 'You are already in a team for this event' });
        }

        // Check if already registered individually (if mixed allowed? Assuming exclusive)
        const existingTicket = await Ticket.findOne({
            userId: req.user.userId,
            eventId,
            status: 'Confirmed'
        });

        if (existingTicket) {
            return res.status(400).json({ error: 'You already have a ticket for this event' });
        }

        // Check Max Teams limit
        if (event.maxTeams) {
            const currentTeamCount = await Team.countDocuments({ eventId });
            if (currentTeamCount >= event.maxTeams) {
                return res.status(400).json({ error: 'Maximum number of teams reached for this event' });
            }
        }

        const code = await generateTeamCode();

        const team = new Team({
            name,
            code,
            leaderId: req.user.userId,
            members: [req.user.userId], // Leader is also a member
            eventId,
            status: event.minTeamSize <= 1 ? 'Complete' : 'Forming'
        });

        await team.save();

        let ticket = null;
        if (team.status === 'Complete') {
            ticket = new Ticket({
                userId: req.user.userId,
                eventId: event._id,
                teamId: team._id, // Added missing teamId
                status: 'Confirmed',
                answers: []
            });
            await ticket.save();
        }

        // Send Email to Leader
        const User = require('../models/User');
        const user = await User.findById(req.user.userId);
        const sendEmail = require('../utils/emailService');

        const emailSubject = `Team Created - ${team.name}`;
        const emailText = `Hello ${user.name},\n\nYou have successfully created the team "${team.name}" for ${event.name}.\n\nTeam Code: ${code}\n\nShare this code with your team members so they can join.\n\nBest regards,\nEvent Management Team`;
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4a90e2;">Team Created!</h2>
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>You have successfully created the team <strong>"${team.name}"</strong> for <strong>${event.name}</strong>.</p>
                <div style="background: #e1f5fe; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #29b6f6;">
                    <p><strong>Your Team Code:</strong> <span style="font-size: 24px; font-family: monospace; font-weight: bold; letter-spacing: 2px;">${code}</span></p>
                </div>
                <p>Share this code with your team members so they can join your team.</p>
                <p>Best regards,<br>Event Management Team</p>
                <hr>
                <p style="font-size: 12px; color: #888;">This is an automated email. Please do not reply.</p>
            </div>
        `;

        sendEmail(user.email, emailSubject, emailText, emailHtml);

        res.status(201).json({
            message: 'Team created successfully',
            team,
            ticket, // Null if forming
            teamCode: code
        });

    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   POST /api/teams/join
 * @desc    Join a team using code
 * @access  Participant
 */
router.post('/join', checkRole(['Participant']), async (req, res) => {
    try {
        const { code, eventId } = req.body;

        if (!code || !eventId) {
            return res.status(400).json({ error: 'Team code and Event ID are required' });
        }

        const team = await Team.findOne({ code, eventId });
        if (!team) {
            return res.status(404).json({ error: 'Invalid team code for this event' });
        }

        const event = await Event.findById(eventId);

        // Check if full
        if (team.members.length >= event.maxTeamSize) {
            return res.status(400).json({ error: 'Team is full' });
        }

        // Check if already in a team
        const existingUserTeam = await Team.findOne({
            eventId,
            $or: [{ leaderId: req.user.userId }, { members: req.user.userId }]
        });

        if (existingUserTeam) {
            return res.status(400).json({ error: 'You are already in a team for this event' });
        }

        // Check for existing ticket
        const existingTicket = await Ticket.findOne({
            userId: req.user.userId,
            eventId,
            status: 'Confirmed'
        });

        if (existingTicket) {
            return res.status(400).json({ error: 'You already have a ticket for this event' });
        }

        // Add user to members
        team.members.push(req.user.userId);

        // Update status if full or meets min
        let ticketsGenerated = false;
        if (team.members.length >= event.minTeamSize && team.status === 'Forming') {
            team.status = 'Complete';
            ticketsGenerated = true;
        }

        await team.save();

        let ticket = null;

        // If tickets just got generated, generate for ALL members
        if (ticketsGenerated) {
            // Generate tickets for all members
            const promises = team.members.map(memberId => {
                return new Ticket({
                    userId: memberId,
                    eventId: event._id,
                    teamId: team._id,
                    status: 'Confirmed',
                    answers: []
                }).save();
            });
            await Promise.all(promises);

            // Retrieve ONLY the current user's ticket to return (optional)
            ticket = await Ticket.findOne({ userId: req.user.userId, eventId });

        } else if (team.status === 'Complete') {
            // If joining an already complete team (e.g. min 2, max 4. 3rd person joins), generate ticket immediately
            ticket = new Ticket({
                userId: req.user.userId,
                eventId: event._id,
                teamId: team._id,
                status: 'Confirmed',
                answers: []
            });
            await ticket.save();
        }

        // Send Email to Joiner
        const User = require('../models/User');
        const user = await User.findById(req.user.userId);
        const sendEmail = require('../utils/emailService');

        const joinSubject = `Joined Team - ${team.name}`;
        const joinText = `Hello ${user.name},\n\nYou have successfully joined the team "${team.name}" for ${event.name}.\n\nStatus: ${team.status}\n\nBest regards,\nEvent Management Team`;
        const joinHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4a90e2;">Team Update</h2>
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>You have successfully joined the team <strong>"${team.name}"</strong> for <strong>${event.name}</strong>.</p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Team Status:</strong> ${team.status}</p>
                    ${team.status === 'Complete' ? '<p style="color: green;"><strong>Registration:</strong> Confirmed! Your ticket is now available.</p>' : '<p style="color: #f39c12;"><strong>Registration:</strong> Pending. Team is still forming.</p>'}
                </div>
                <p>Best regards,<br>Event Management Team</p>
                <hr>
                <p style="font-size: 12px; color: #888;">This is an automated email. Please do not reply.</p>
            </div>
        `;

        sendEmail(user.email, joinSubject, joinText, joinHtml);

        // If tickets generated (Team Complete), send emails to ALL members
        if (ticketsGenerated) {
            const members = await User.find({ _id: { $in: team.members } });
            members.forEach(member => {
                const subject = `Team Complete & Ticket Ready - ${team.name}`;
                const text = `Hello ${member.name},\n\nYour team "${team.name}" is now complete and registered for ${event.name}!\n\nCheck your dashboard for your ticket.\n\nBest regards,\nEvent Management Team`;
                const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #27ae60;">Team Registration Confirmed!</h2>
                        <p>Hello <strong>${member.name}</strong>,</p>
                        <p>Great news! Your team <strong>"${team.name}"</strong> is now complete and registered for <strong>${event.name}</strong>.</p>
                        <div style="background: #eafaf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #27ae60;">
                            <p><strong>Event:</strong> ${event.name}</p>
                            <p><strong>Team:</strong> ${team.name}</p>
                            <p><strong>Status:</strong> Confirmed</p>
                        </div>
                        <p>Your ticket and QR code are now available in your personal dashboard.</p>
                        <p>Best regards,<br>Event Management Team</p>
                        <hr>
                        <p style="font-size: 12px; color: #888;">This is an automated email. Please do not reply.</p>
                    </div>
                `;
                sendEmail(member.email, subject, text, html);
            });
        }

        res.json({
            message: 'Joined team successfully',
            team,
            ticket // Null if forming
        });

    } catch (error) {
        console.error('Join team error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/teams/my-team/:eventId
 * @desc    Get user's team for an event
 * @access  Participant
 */
router.get('/my-team/:eventId', checkRole(['Participant']), async (req, res) => {
    try {
        const team = await Team.findOne({
            eventId: req.params.eventId,
            $or: [{ leaderId: req.user.userId }, { members: req.user.userId }]
        })
            .populate('leaderId', 'name email')
            .populate('members', 'name email');

        if (!team) {
            return res.status(404).json({ message: 'No team found' });
        }

        res.json({ team });

    } catch (error) {
        console.error('Get my team error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
