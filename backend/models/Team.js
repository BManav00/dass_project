const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Team name is required'],
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        minlength: 6,
        maxlength: 6
    },
    leaderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    status: {
        type: String,
        enum: ['Forming', 'Complete'], // Forming = waiting for members, Complete = ready
        default: 'Forming'
    }
}, {
    timestamps: true
});

// Indexes
// teamSchema.index({ code: 1 }, { unique: true }); // Removed: duplicate with schema definition
teamSchema.index({ eventId: 1 });
teamSchema.index({ leaderId: 1 });

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
