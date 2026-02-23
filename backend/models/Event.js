const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Event name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Event description is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['Normal', 'Merch'],
        default: 'Normal',
        required: true
    },
    isTeamEvent: {
        type: Boolean,
        default: false
    },
    minTeamSize: {
        type: Number,
        default: 1
    },
    maxTeamSize: {
        type: Number,
        default: 1
    },
    maxTeams: {
        type: Number,
        default: null // null means unlimited
    },
    startDate: {
        type: Date,
        required: [true, 'Event start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'Event end date is required']
    },
    registrationDeadline: {
        type: Date,
        required: [true, 'Registration deadline is required']
    },
    tags: [{
        type: String,
        trim: true
    }],
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Organizer ID is required']
    },
    formFields: [{
        fieldName: {
            type: String,
            required: true,
            trim: true
        },
        fieldType: {
            type: String,
            enum: ['text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio', 'date'],
            required: true
        },
        label: {
            type: String,
            required: true,
            trim: true
        },
        placeholder: {
            type: String,
            trim: true
        },
        required: {
            type: Boolean,
            default: false
        },
        options: [{
            type: String,
            trim: true
        }], // For select, checkbox, radio types
        validation: {
            min: Number,
            max: Number,
            pattern: String,
            message: String
        }
    }],
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    maxParticipants: {
        type: Number,
        default: null // null means unlimited
    },
    price: {
        type: Number,
        default: 0,
        min: 0
    },
    stock: {
        type: Number,
        default: null, // null means unlimited
        min: 0
    },
    eligibility: {
        type: String,
        enum: ['IIIT', 'All'],
        default: 'All'
    },
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Closed', 'Cancelled'],
        default: 'Draft'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
eventSchema.index({ startDate: 1 });
eventSchema.index({ organizerId: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ status: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
