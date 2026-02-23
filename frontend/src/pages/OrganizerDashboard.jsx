import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, logout } from '../utils/auth';
import api from '../api/axios';
import './OrganizerDashboard.css';

const OrganizerDashboard = ({ ongoingOnly = false }) => {
    const navigate = useNavigate();
    const user = getUser();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        totalRegistrations: 0,
        totalRevenue: 0,
        totalAttendance: 0,
        completedEventsCount: 0
    });
    const [expandedEvent, setExpandedEvent] = useState(null);
    const [participants, setParticipants] = useState({});
    const [feedbackData, setFeedbackData] = useState({});
    const [showingFeedback, setShowingFeedback] = useState({});

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/events');
            let allEvents = response.data.events;

            // Calculate aggregate stats for completed events
            const completedEvents = allEvents.filter(e => e.status === 'Completed');
            let totalReg = 0;
            let totalRev = 0;
            let totalAtt = 0;

            completedEvents.forEach(e => {
                const regs = e.participants?.length || 0;
                totalReg += regs;
                totalRev += (e.price || 0) * regs;
                // Since we don't have attendance count per event easily here, 
                // we'll fetch them individually or use a new endpoint. 
                // For now, let's assume attendance is tracked in backend.
            });

            setStats({
                totalRegistrations: totalReg,
                totalRevenue: totalRev,
                totalAttendance: totalAtt, // Placeholder or fetch
                completedEventsCount: completedEvents.length
            });

            if (ongoingOnly) {
                allEvents = allEvents.filter(e => e.status === 'Ongoing');
            }

            setEvents(allEvents);
        } catch (err) {
            console.error('Fetch events error:', err);
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleCreateEvent = () => {
        navigate('/organizer/create-event');
    };

    const handleDeleteEvent = async (eventId, eventName) => {
        if (!window.confirm(`Are you sure you want to delete "${eventName}"?`)) {
            return;
        }

        try {
            await api.delete(`/api/events/${eventId}`);
            alert('Event deleted successfully');
            fetchEvents(); // Refresh the list
        } catch (err) {
            console.error('Delete event error:', err);
            alert(err.response?.data?.error || err.response?.data?.message || 'Failed to delete event');
        }
    };

    const handlePublishEvent = async (eventId, eventName) => {
        if (!window.confirm(`Are you sure you want to publish "${eventName}"? Once published, you cannot edit or delete it.`)) {
            return;
        }

        try {
            await api.patch(`/api/events/${eventId}/publish`);
            alert('Event published successfully');
            fetchEvents(); // Refresh the list
        } catch (err) {
            console.error('Publish event error:', err);
            alert(err.response?.data?.error || err.response?.data?.message || 'Failed to publish event');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const fetchParticipants = async (eventId) => {
        try {
            const response = await api.get(`/api/events/${eventId}/participants`);
            setParticipants(prev => ({
                ...prev,
                [eventId]: response.data
            }));
        } catch (err) {
            console.error('Fetch participants error:', err);
            alert('Failed to load participants');
        }
    };

    const fetchFeedback = async (eventId) => {
        try {
            const response = await api.get(`/api/events/${eventId}/feedback`);
            setFeedbackData(prev => ({
                ...prev,
                [eventId]: response.data
            }));
        } catch (err) {
            console.error('Fetch feedback error:', err);
            // It's okay if no feedback/error, but let's log it
        }
    };

    const toggleParticipants = async (eventId) => {
        // Toggle off feedback if open
        setShowingFeedback(prev => ({ ...prev, [eventId]: false }));

        if (expandedEvent === eventId) {
            setExpandedEvent(null);
        } else {
            setExpandedEvent(eventId);
            if (!participants[eventId]) {
                await fetchParticipants(eventId);
            }
        }
    };

    const toggleFeedback = async (eventId) => {
        // Toggle off participants if open
        setExpandedEvent(null);

        setShowingFeedback(prev => {
            const newState = { ...prev, [eventId]: !prev[eventId] };
            if (newState[eventId] && !feedbackData[eventId]) {
                fetchFeedback(eventId);
            }
            return newState;
        });
    };

    const formatRegistrationDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Draft': return 'status-draft';
            case 'Published': return 'status-published';
            case 'Cancelled': return 'status-cancelled';
            case 'Completed': return 'status-completed';
            default: return '';
        }
    };

    return (
        <div className="organizer-container">
            <div className="organizer-header">
                <div>
                    <h1>Organizer Dashboard</h1>
                    <p className="organizer-subtitle">Welcome, {user?.name}</p>
                </div>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </div>

            <div className="organizer-content">
                {/* User Info Card */}
                <div className="welcome-card">
                    <h2>👤 Your Profile</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Email:</span>
                            <span className="info-value">{user?.email}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Role:</span>
                            <span className="info-value">{user?.role}</span>
                        </div>
                        {user?.metadata?.clubName && (
                            <div className="info-item">
                                <span className="info-label">Club:</span>
                                <span className="info-value">{user.metadata.clubName}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Aggregate Analytics Section */}
                {!ongoingOnly && stats.completedEventsCount > 0 && (
                    <div className="analytics-overview-cards">
                        <div className="analytics-card revenue">
                            <div className="analytics-icon">💰</div>
                            <div className="analytics-data">
                                <span className="analytics-label">Total Revenue</span>
                                <span className="analytics-value">₹{stats.totalRevenue.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="analytics-card registrations">
                            <div className="analytics-icon">🎫</div>
                            <div className="analytics-data">
                                <span className="analytics-label">Total Registrations</span>
                                <span className="analytics-value">{stats.totalRegistrations}</span>
                            </div>
                        </div>
                        <div className="analytics-card events-comp">
                            <div className="analytics-icon">✅</div>
                            <div className="analytics-data">
                                <span className="analytics-label">Completed Events</span>
                                <span className="analytics-value">{stats.completedEventsCount}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Events Section */}
                <div className="events-section">
                    <div className="dashboard-header">
                        <h2>
                            {ongoingOnly ? '🔥 Ongoing Events' : '🕒 Manage Events'}
                        </h2>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => navigate('/organizer/scan')} className="create-event-btn" style={{ background: '#2e7d32' }}>
                                📷 Scan QR Code
                            </button>
                            <button onClick={() => navigate('/organizer/create-event')} className="create-event-btn">
                                + Create New Event
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    {loading ? (
                        <div className="loading-message">Loading events...</div>
                    ) : events.length === 0 ? (
                        <div className="empty-state">
                            <p>{ongoingOnly ? 'No ongoing events at the moment.' : "You haven't created any events yet."}</p>
                            {!ongoingOnly && (
                                <button onClick={handleCreateEvent} className="create-first-event-btn">
                                    Create Your First Event
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="events-carousel-container">
                            <div className="events-carousel">
                                {events.map(event => (
                                    <div key={event._id} className="event-card-carousel-item">
                                        <div className="event-card">
                                            <div className="event-card-header">
                                                <h3 title={event.name}>{event.name}</h3>
                                                <span className={`status-badge ${getStatusBadgeClass(event.status)}`}>
                                                    {event.status}
                                                </span>
                                            </div>

                                            <p className="event-description">
                                                {event.description.length > 100
                                                    ? `${event.description.substring(0, 100)}...`
                                                    : event.description}
                                            </p>

                                            <div className="event-details">
                                                <div className="event-detail-item">
                                                    <span className="detail-icon">📅</span>
                                                    <span>{formatDate(event.startDate)}</span>
                                                </div>
                                                <div className="event-detail-item">
                                                    <span className="detail-icon">👥</span>
                                                    <span>{event.participants?.length || 0} Registered</span>
                                                </div>
                                            </div>

                                            <div className="event-actions">
                                                <button
                                                    onClick={() => navigate(`/organizer/events/${event._id}`)}
                                                    className="manage-event-btn"
                                                >
                                                    Manage Event
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizerDashboard;
