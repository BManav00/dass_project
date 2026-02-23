import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, logout } from '../utils/auth';
import api from '../api/axios';
import QRCode from 'react-qr-code';
import ChatBox from '../components/Chat/ChatBox';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const user = getUser();
    const [activeTab, setActiveTab] = useState('upcoming');
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeChatTeam, setActiveChatTeam] = useState(null);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedTicketForFeedback, setSelectedTicketForFeedback] = useState(null);
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const getEventDate = (event) => {
        if (!event) return null;
        return event.startDate || event.date;
    };

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/events/my-registrations');
            console.log('Fetched tickets:', response.data.tickets);
            setTickets(response.data.tickets);
        } catch (err) {
            console.error('Fetch tickets error:', err);
            setError('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRegistration = async (eventId, eventName) => {
        if (!window.confirm(`Are you sure you want to cancel your registration for "${eventName}"?`)) {
            return;
        }

        try {
            await api.post(`/api/events/${eventId}/cancel`);
            // Refresh tickets
            fetchTickets();
            alert('Registration cancelled successfully');
        } catch (err) {
            console.error('Cancel registration error:', err);
            alert(err.response?.data?.message || 'Failed to cancel registration');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleOpenFeedback = (ticket) => {
        setSelectedTicketForFeedback(ticket);
        setFeedbackRating(5); // Default
        setFeedbackComment('');
        setFeedbackModalOpen(true);
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        setSubmittingFeedback(true);
        try {
            await api.post(`/api/events/${selectedTicketForFeedback.eventId._id}/feedback`, {
                rating: parseInt(feedbackRating),
                comment: feedbackComment
            });
            alert('Feedback submitted successfully!');
            setFeedbackModalOpen(false);
            fetchTickets(); // Refresh to update feedbackGiven status
        } catch (err) {
            console.error('Submit feedback error:', err);
            alert(err.response?.data?.error || 'Failed to submit feedback');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const filterTickets = () => {
        const now = new Date();

        switch (activeTab) {
            case 'upcoming':
                return tickets.filter(t => {
                    if (!t.eventId || t.status !== 'Confirmed') return false;
                    const eventDate = getEventDate(t.eventId);
                    const isFuture = eventDate && new Date(eventDate) > now;
                    // Upcoming if (Published and in future) OR Ongoing
                    return (t.eventId.status === 'Published' && isFuture) || t.eventId.status === 'Ongoing';
                });
            case 'normal':
                return tickets.filter(t =>
                    t.eventId && t.eventId.type === 'Normal' && t.status === 'Confirmed'
                );
            case 'merchandise':
                return tickets.filter(t =>
                    t.eventId && t.eventId.type === 'Merch' && t.status === 'Confirmed'
                );
            case 'completed':
                return tickets.filter(t => {
                    if (!t.eventId || t.status !== 'Confirmed') return false;
                    const eventDate = getEventDate(t.eventId);
                    const isPast = eventDate && new Date(eventDate) <= now;
                    // Completed if status is 'Completed' OR (Published and in past)
                    return t.eventId.status === 'Completed' || (t.eventId.status === 'Published' && isPast);
                });
            case 'cancelled':
                return tickets.filter(t => t.status === 'Cancelled' || t.status === 'Rejected');
            default:
                return tickets;
        }
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return 'No Date';
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTicketId = (id) => {
        return id.substring(0, 8).toUpperCase();
    };

    const getTimeUntil = (dateValue) => {
        if (!dateValue) return 'N/A';
        const eventDate = new Date(dateValue);
        if (isNaN(eventDate.getTime())) return 'Invalid date';
        const now = new Date();
        const diff = eventDate - now;

        if (diff < 0) return 'Event passed';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} away`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} away`;
        return 'Starting soon!';
    };

    const filteredTickets = filterTickets();

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>My Tickets</h1>
                    <p className="dashboard-subtitle">Welcome back, {user?.name}!</p>
                </div>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </div>

            <div className="dashboard-content">
                <div className="quick-actions">
                    <button
                        onClick={() => navigate('/events')}
                        className="action-btn browse"
                    >
                        📅 Browse Events
                    </button>
                </div>

                <div className="tabs-container">
                    <div className="tabs">
                        <button
                            className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                            onClick={() => setActiveTab('upcoming')}
                        >
                            Upcoming ({tickets.filter(t => {
                                if (!t.eventId || t.status !== 'Confirmed') return false;
                                const eventDate = getEventDate(t.eventId);
                                const isFuture = eventDate && new Date(eventDate) > new Date();
                                return (t.eventId.status === 'Published' && isFuture) || t.eventId.status === 'Ongoing';
                            }).length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'normal' ? 'active' : ''}`}
                            onClick={() => setActiveTab('normal')}
                        >
                            Normal ({tickets.filter(t => t.eventId?.type === 'Normal' && t.status === 'Confirmed').length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'merchandise' ? 'active' : ''}`}
                            onClick={() => setActiveTab('merchandise')}
                        >
                            Merch ({tickets.filter(t => t.eventId?.type === 'Merch' && t.status === 'Confirmed').length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                            onClick={() => setActiveTab('completed')}
                        >
                            Completed ({tickets.filter(t => {
                                if (!t.eventId || t.status !== 'Confirmed') return false;
                                const eventDate = getEventDate(t.eventId);
                                const isPast = eventDate && new Date(eventDate) <= new Date();
                                return t.eventId.status === 'Completed' || (t.eventId.status === 'Published' && isPast);
                            }).length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
                            onClick={() => setActiveTab('cancelled')}
                        >
                            Cancelled ({tickets.filter(t => t.status === 'Cancelled' || t.status === 'Rejected').length})
                        </button>
                    </div>

                    <div className="tab-content">
                        {loading ? (
                            <div className="loading-state">Loading your tickets...</div>
                        ) : error ? (
                            <div className="error-state">{error}</div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🎫</div>
                                <h3>No {activeTab} tickets</h3>
                                <p>
                                    {activeTab === 'upcoming' && "You don't have any upcoming events. Browse events to register!"}
                                    {activeTab === 'past' && "You haven't attended any events yet."}
                                    {activeTab === 'cancelled' && "You don't have any cancelled tickets."}
                                </p>
                                {activeTab === 'upcoming' && (
                                    <button
                                        onClick={() => navigate('/events')}
                                        className="browse-btn"
                                    >
                                        Browse Events
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="tickets-grid">
                                {filteredTickets.map(ticket => (
                                    <div key={ticket._id} className="ticket-card">
                                        <div className="ticket-header">
                                            <h3>{ticket.eventId?.name || 'Unknown Event'}</h3>
                                            <span className={`status-badge ${ticket.status.toLowerCase()}`}>
                                                {ticket.status}
                                            </span>
                                        </div>

                                        <div className="ticket-body">
                                            <div className="ticket-info">
                                                <div className="info-row">
                                                    <span className="icon">📅</span>
                                                    <div>
                                                        <div className="info-label">Event Date</div>
                                                        <div className="info-value">
                                                            {formatDate(getEventDate(ticket.eventId))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="countdown">
                                                    ⏰ {getTimeUntil(getEventDate(ticket.eventId))}
                                                </div>

                                                <div className="info-row">
                                                    <span className="icon">📍</span>
                                                    <div>
                                                        <div className="info-label">Type</div>
                                                        <div className="info-value">{ticket.eventId?.type || 'Normal'}</div>
                                                    </div>
                                                </div>

                                                <div className="ticket-id-section">
                                                    <div className="ticket-id-label">Ticket ID</div>
                                                    <div
                                                        className="ticket-id-value"
                                                        title="Click to copy ID"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(ticket._id);
                                                            alert('Ticket ID copied to clipboard!');
                                                        }}
                                                    >
                                                        {ticket._id}
                                                    </div>
                                                    {ticket.teamId && (
                                                        <div className="team-code-display">
                                                            <span>Team Code:</span>
                                                            <strong>{ticket.teamId.code}</strong>
                                                        </div>
                                                    )}
                                                    <div className="qr-stub">
                                                        <div style={{ background: 'white', padding: '10px', display: 'inline-block' }}>
                                                            <QRCode
                                                                value={ticket._id}
                                                                size={100}
                                                                level="H"
                                                            />
                                                        </div>
                                                        <div className="qr-label">Scan to Verify</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="ticket-footer">
                                            {/* Feedback Button for Past Events */}
                                            {activeTab === 'completed' && ticket.checkedIn && !ticket.feedbackGiven && (
                                                <button
                                                    onClick={() => handleOpenFeedback(ticket)}
                                                    className="view-details-btn"
                                                    style={{ background: '#ff9800', marginBottom: '10px' }}
                                                >
                                                    ⭐ Leave Feedback
                                                </button>
                                            )}

                                            {ticket.teamId && (
                                                <button
                                                    onClick={() => setActiveChatTeam(ticket.teamId)}
                                                    className="chat-btn"
                                                >
                                                    💬 Team Chat
                                                </button>
                                            )}

                                            <button
                                                onClick={() => navigate(`/events/${ticket.eventId?._id}`)}
                                                className="view-details-btn"
                                            >
                                                View Details
                                            </button>

                                            {ticket.status === 'Confirmed' && new Date(getEventDate(ticket.eventId)) > new Date() && (
                                                <button
                                                    onClick={() => handleCancelRegistration(ticket.eventId?._id, ticket.eventId?.name)}
                                                    className="cancel-btn"
                                                >
                                                    Cancel Registration
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Modal */}
                {activeChatTeam && (
                    <div className="chat-modal-overlay" style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div className="chat-modal-content" style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            width: '90%',
                            maxWidth: '500px',
                            position: 'relative',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            <button
                                onClick={() => setActiveChatTeam(null)}
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#666'
                                }}
                            >
                                &times;
                            </button>

                            <ChatBox
                                roomId={activeChatTeam._id}
                                userId={user.id}
                                userName={user.name}
                                title={`Team Chat: ${activeChatTeam.name}`}
                            />
                        </div>
                    </div>
                )}

                {/* Feedback Modal */}
                {feedbackModalOpen && (
                    <div className="modal-overlay" style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div className="modal-content" style={{
                            backgroundColor: 'white',
                            padding: '2rem',
                            borderRadius: '12px',
                            maxWidth: '500px',
                            width: '90%',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                        }}>
                            <h2 style={{ marginTop: 0 }}>Leave Anonymous Feedback</h2>
                            <p>How was <strong>{selectedTicketForFeedback?.eventId?.name}</strong>?</p>

                            <form onSubmit={handleSubmitFeedback}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Rating (1-5)</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <button
                                                type="button"
                                                key={num}
                                                onClick={() => setFeedbackRating(num)}
                                                style={{
                                                    fontSize: '1.5rem',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    opacity: num <= feedbackRating ? 1 : 0.3,
                                                    transition: 'opacity 0.2s'
                                                }}
                                            >
                                                ⭐
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Comments (Optional)</label>
                                    <textarea
                                        value={feedbackComment}
                                        onChange={e => setFeedbackComment(e.target.value)}
                                        rows={4}
                                        placeholder="What did you like? What can we improve?"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setFeedbackModalOpen(false)}
                                        style={{
                                            padding: '10px 20px',
                                            background: '#f0f0f0',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingFeedback}
                                        style={{
                                            padding: '10px 20px',
                                            background: '#667eea',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
