const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        // unique: true, // Removed for Module 9: Allow duplicate emails for Guests
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: ['Participant', 'Organizer', 'Admin'],
        default: 'Participant'
    },
    isIIIT: {
        type: Boolean,
        default: false
    },
    // Flattened metadata for easier access, could keep in metadata obj too
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    contactNumber: {
        type: String,
        trim: true
    },
    college: {
        type: String,
        trim: true
    },
    interests: [{
        type: String,
        trim: true
    }],
    followedClubs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    studentId: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        trim: true
    },
    batch: { // Renamed from year/batch to be generic
        type: String
    },
    year: {
        type: Number
    },
    // Organizer-specific fields
    category: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    contactEmail: {
        type: String,
        trim: true
    },
    discordWebhook: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Index for faster queries
// Note: email index is automatically created by unique: true
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
