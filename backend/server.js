require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ["GET", "POST"]
    }
});

// Attach Socket Handler
const socketHandler = require('./socket');
socketHandler(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'MERN Event Management API' });
});

// Health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'Connected'
    });
});

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const eventRoutes = require('./routes/events');
app.use('/api/events', eventRoutes);

const teamRoutes = require('./routes/teams');
app.use('/api/teams', teamRoutes);

const ticketRoutes = require('./routes/tickets');
app.use('/api/tickets', ticketRoutes);

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

const messageRoutes = require('./routes/messages');
app.use('/api/messages', messageRoutes);

// Protected test route (for verification)
const authMiddleware = require('./middleware/authMiddleware');
const checkRole = require('./middleware/roleMiddleware');

app.get('/api/protected-test', authMiddleware, (req, res) => {
    res.json({
        message: 'Access granted to protected route',
        user: req.user
    });
});

app.get('/api/admin-test', authMiddleware, checkRole(['Admin']), (req, res) => {
    res.json({
        message: 'Access granted to admin-only route',
        user: req.user
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;

// Start server after DB connection
const startServer = async () => {
    try {
        // Connect to MongoDB first
        await connectDB();

        // Seed admin user after DB is connected
        const seedAdmin = require('./utils/seedAdmin');
        await seedAdmin();

        // Start the server (using http server, not app)
        server.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
            console.log(`Socket.io initialized`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
