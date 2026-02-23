const Message = require('../models/Message');

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Join a specific room (Event or Team)
        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room: ${roomId}`);
        });

        // Leave a room
        socket.on('leave_room', (roomId) => {
            socket.leave(roomId);
            console.log(`Socket ${socket.id} left room: ${roomId}`);
        });

        // Handle sending messages
        socket.on('send_message', async (data) => {
            try {
                const { roomId, senderId, senderName, content } = data;

                // Save to Database
                const newMessage = new Message({
                    roomId,
                    senderId,
                    senderName,
                    content
                });
                await newMessage.save();

                // Broadcast to room (including sender, for simple confirmation, or use broadcast.to to exclude)
                // Using io.to().emit() ensures everyone gets the finalized DB object (e.g. with timestamp)
                io.to(roomId).emit('receive_message', newMessage);

            } catch (error) {
                console.error('Error saving/sending message:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
        });
    });
};

module.exports = socketHandler;
