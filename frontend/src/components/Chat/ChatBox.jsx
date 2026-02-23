import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import api from '../../api/axios';
import './ChatBox.css';

// Connect to backend (adjust URL if deployed)
const SOCKET_URL = 'http://localhost:5000';

const ChatBox = ({ roomId, userId, userName, title }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    // Fetch history and connect socket
    useEffect(() => {
        // Fetch chat history
        const fetchHistory = async () => {
            try {
                const response = await api.get(`/api/messages/${roomId}`);
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching chat history:', error);
            }
        };

        fetchHistory();

        // Connect Socket
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            newSocket.emit('join_room', roomId);
        });

        newSocket.on('receive_message', (message) => {
            console.log('Received message:', message);
            setMessages((prev) => [...prev, message]);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [roomId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const messageData = {
            roomId,
            senderId: userId,
            senderName: userName,
            content: newMessage
        };

        // Emit to server
        socket.emit('send_message', messageData);
        setNewMessage('');
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3>{title || 'Chat'}</h3>
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="no-messages">No messages yet. Be the first to say hi!</div>
                ) : (
                    messages.map((msg, index) => {
                        const isOwnMessage = msg.senderId === userId;
                        return (
                            <div
                                key={index}
                                className={`message-bubble ${isOwnMessage ? 'own-message' : 'other-message'}`}
                            >
                                <div className="message-sender">{msg.senderName}</div>
                                <div className="message-content">{msg.content}</div>
                                <div className="message-time">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="chat-input"
                />
                <button type="submit" className="chat-send-btn">Send</button>
            </form>
        </div>
    );
};

export default ChatBox;
