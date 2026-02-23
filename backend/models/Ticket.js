const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    answers: [{
        label: {
            type: String,
            required: true
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        }
    }],
    status: {
        type: String,
        enum: ['Confirmed', 'Cancelled'],
        default: 'Confirmed'
    },
    checkedIn: {
        type: Boolean,
        default: false
    },
    feedbackGiven: {
        type: Boolean,
        default: false
    },
    checkInTime: {
        type: Date
    },
    registeredAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate registrations
ticketSchema.index({ userId: 1, eventId: 1 }, { unique: true });

// Index for faster queries
ticketSchema.index({ eventId: 1 });
ticketSchema.index({ userId: 1 });
ticketSchema.index({ status: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
