import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser } from '../utils/auth';
import api from '../api/axios';
import ChatBox from '../components/Chat/ChatBox';
import './EventDetails.css';

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = getUser();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({});
    const [teamsCount, setTeamsCount] = useState(0);
    const [participantsCount, setParticipantsCount] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [teamMode, setTeamMode] = useState('none'); // 'none', 'create', 'join'
    const [teamData, setTeamData] = useState({ name: '', code: '' });
    const [myTeam, setMyTeam] = useState(null);
    const [registered, setRegistered] = useState(false);
    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'discussion'

    useEffect(() => {
        fetchEvent();
        checkRegistration();
        if (user && user.role === 'Participant') {
            fetchMyTeam(id);
        }
    }, [id, user?.id]); // Fix: Use user.id to avoid infinite loop (getUser returns new obj every time)

    const fetchEvent = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/events/${id}`);
            setEvent(response.data.event);
            if (response.data.teamsCount !== undefined) {
                setTeamsCount(response.data.teamsCount);
            }
            if (response.data.participantsCount !== undefined) {
                setParticipantsCount(response.data.participantsCount);
            }

            // Initialize form data with empty values
            const initialData = {};
            response.data.event.formFields.forEach(field => {
                initialData[field.label] = '';
            });
            setFormData(initialData);

            if (response.data.event.isTeamEvent && user && user.role === 'Participant') {
                fetchMyTeam(response.data.event._id);
            }
        } catch (err) {
            console.error('Fetch event error:', err);
            setError(err.response?.data?.message || 'Failed to load event');
        } finally {
            setLoading(false);
        }
    };

    const checkRegistration = async () => {
        if (!user || user.role !== 'Participant') return;

        try {
            const response = await api.get('/api/events/my-registrations');
            const isRegistered = response.data.tickets.some(
                ticket => ticket.eventId._id === id && ticket.status === 'Confirmed'
            );
            setRegistered(isRegistered);
            // If registered for a team event, also fetch team info
            if (isRegistered && event && event.isTeamEvent) {
                fetchMyTeam(id);
            }
        } catch (err) {
            console.error('Check registration error:', err);
        }
    };

    const handleInputChange = (label, value) => {
        setFormData(prev => ({
            ...prev,
            [label]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            // Convert formData to answers array
            const answers = Object.entries(formData).map(([label, value]) => ({
                label,
                value
            }));

            const response = await api.post(`/api/events/${id}/register`, {
                answers
            });

            alert('Registration successful! Check your email for confirmation.');
            setRegistered(true);
            navigate('/my-registrations');
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    const renderFormField = (field) => {
        const { label, fieldType, options, required } = field;

        switch (fieldType) {
            case 'text':
            case 'email':
            case 'number':
                return (
                    <input
                        type={fieldType}
                        value={formData[label] || ''}
                        onChange={(e) => handleInputChange(label, e.target.value)}
                        required={required}
                        className="form-input"
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        value={formData[label] || ''}
                        onChange={(e) => handleInputChange(label, e.target.value)}
                        required={required}
                        className="form-textarea"
                        rows="4"
                    />
                );

            case 'select':
                return (
                    <select
                        value={formData[label] || ''}
                        onChange={(e) => handleInputChange(label, e.target.value)}
                        required={required}
                        className="form-select"
                    >
                        <option value="">Select an option...</option>
                        {options.map((option, idx) => (
                            <option key={idx} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );

            case 'radio':
                return (
                    <div className="radio-group">
                        {options.map((option, idx) => (
                            <label key={idx} className="radio-label">
                                <input
                                    type="radio"
                                    name={label}
                                    value={option}
                                    checked={formData[label] === option}
                                    onChange={(e) => handleInputChange(label, e.target.value)}
                                    required={required}
                                />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'checkbox':
                return (
                    <div className="checkbox-group">
                        {options.map((option, idx) => (
                            <label key={idx} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    value={option}
                                    checked={(formData[label] || []).includes(option)}
                                    onChange={(e) => {
                                        const currentValues = formData[label] || [];
                                        const newValues = e.target.checked
                                            ? [...currentValues, option]
                                            : currentValues.filter(v => v !== option);
                                        handleInputChange(label, newValues);
                                    }}
                                />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>
                );

            default:
                return null;
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

    const fetchMyTeam = async (eventId) => {
        try {
            const response = await api.get(`/api/teams/my-team/${eventId}`);
            setMyTeam(response.data.team);
        } catch (err) {
            // It's okay if no team found
            console.log('No team found or error:', err);
            setMyTeam(null); // Ensure myTeam is null if no team is found
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const response = await api.post('/api/teams/create', {
                eventId: event._id,
                name: teamData.name
            });

            alert(`Team "${response.data.team.name}" created! Code: ${response.data.team.code}`);
            setMyTeam(response.data.team);

            if (response.data.ticket) {
                setRegistered(true);
            }
            setTeamMode('none');
        } catch (err) {
            console.error('Create team error:', err);
            setError(err.response?.data?.error || 'Failed to create team');
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoinTeam = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const response = await api.post('/api/teams/join', {
                eventId: event._id,
                code: teamData.code
            });

            alert('Joined team successfully!');
            setMyTeam(response.data.team);

            if (response.data.ticket) {
                setRegistered(true);
            }
            setTeamMode('none');
        } catch (err) {
            console.error('Join team error:', err);
            setError(err.response?.data?.error || 'Failed to join team');
        } finally {
            setSubmitting(false);
        }
    };

    const isEventPast = () => {
        return new Date(event.startDate) < new Date();
    };

    const renderRegistrationSection = () => {
        if (event.isTeamEvent) {
            /* Team Event Logic */
            if (myTeam) {
                return (
                    <div className="team-info-card" style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                        <h3>Your Team: {myTeam.name}</h3>
                        <p className="team-code" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#667eea', margin: '0.5rem 0' }}>
                            Code: {myTeam.code}
                        </p>
                        <p>Status: <span style={{ color: myTeam.status === 'Complete' ? 'green' : 'orange' }}>{myTeam.status}</span></p>

                        <div className="members-list" style={{ marginTop: '1rem' }}>
                            <strong>Members ({myTeam.members.length}/{event.maxTeamSize}):</strong>
                            <ul style={{ paddingLeft: '20px', marginTop: '0.5rem' }}>
                                {myTeam.members.map(m => (
                                    <li key={m._id}>
                                        {m.name} {m._id === myTeam.leaderId._id ? '(Leader)' : ''}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {myTeam.status === 'Forming' && (
                            <div className="alert-info" style={{ marginTop: '1rem', padding: '10px', background: '#e3f2fd', color: '#0d47a1', borderRadius: '4px' }}>
                                Share the team code <strong>{myTeam.code}</strong> with your teammates to complete the team.
                                <br />
                                Min required: {event.minTeamSize} members.
                            </div>
                        )}
                    </div>
                );
            } else {
                return (
                    <div className="team-actions">
                        <h2>Register as Team</h2>
                        {error && <div className="error-message">{error}</div>}

                        {teamMode === 'none' && (
                            <div className="team-buttons" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    onClick={() => setTeamMode('create')}
                                    className="submit-button"
                                    style={{ flex: 1 }}
                                >
                                    Create New Team
                                </button>
                                <button
                                    onClick={() => setTeamMode('join')}
                                    className="submit-button"
                                    style={{ flex: 1, background: 'transparent', border: '2px solid #667eea', color: '#667eea' }}
                                >
                                    Join Existing Team
                                </button>
                            </div>
                        )}

                        {teamMode === 'create' && (
                            <form onSubmit={handleCreateTeam} className="registration-form">
                                <div className="form-group">
                                    <label>Team Name</label>
                                    <input
                                        type="text"
                                        value={teamData.name}
                                        onChange={e => setTeamData({ ...teamData, name: e.target.value })}
                                        required
                                        placeholder="Enter team name"
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="button" onClick={() => setTeamMode('none')} className="submit-button" style={{ background: '#999' }}>Cancel</button>
                                    <button type="submit" disabled={submitting} className="submit-button">
                                        {submitting ? 'Creating...' : 'Create Team'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {teamMode === 'join' && (
                            <form onSubmit={handleJoinTeam} className="registration-form">
                                <div className="form-group">
                                    <label>Team Code</label>
                                    <input
                                        type="text"
                                        value={teamData.code}
                                        onChange={e => setTeamData({ ...teamData, code: e.target.value.toUpperCase() })}
                                        required
                                        placeholder="Enter 6-character code"
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="button" onClick={() => setTeamMode('none')} className="submit-button" style={{ background: '#999' }}>Cancel</button>
                                    <button type="submit" disabled={submitting} className="submit-button">
                                        {submitting ? 'Joining...' : 'Join Team'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                );
            }
        } else {
            /* Normal Registration */
            return (
                <>
                    <h2>{event.type === 'Merch' ? 'Purchase This Item' : 'Register for This Event'}</h2>
                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit} className="registration-form">
                        {event.formFields.map((field, index) => (
                            <div key={index} className="form-field">
                                <label className="form-label">
                                    {field.label}
                                    {field.required && <span className="required">*</span>}
                                </label>
                                {renderFormField(field)}
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="submit-button"
                        >
                            {submitting
                                ? (event.type === 'Merch' ? 'Processing...' : 'Registering...')
                                : (event.type === 'Merch' ? '🛍️ Buy Now' : 'Register Now')
                            }
                        </button>
                    </form>
                </>
            );
        }
    };

    if (loading) {
        return (
            <div className="event-details-container">
                <div className="loading">Loading event details...</div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="event-details-container">
                <div className="error-message">{error || 'Event not found'}</div>
                <button onClick={() => navigate('/events')} className="back-button">
                    ← Back to Events
                </button>
            </div>
        );
    }

    return (
        <div className="event-details-container">
            <button onClick={() => navigate('/events')} className="back-button">
                ← Back to Events
            </button>

            <div className="event-details-card">
                <div className="event-header">
                    <div>
                        <h1>{event.name}</h1>
                        <div className="event-meta">
                            <span className={`event-type-badge ${event.type.toLowerCase()}`}>
                                {event.type}
                            </span>
                            <span className="event-date">📅 {formatDate(event.startDate)}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="event-tabs" style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
                    <button
                        className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveTab('details')}
                        style={{
                            padding: '10px 20px',
                            background: activeTab === 'details' ? 'white' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'details' ? '2px solid #007bff' : 'none',
                            fontWeight: activeTab === 'details' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            color: activeTab === 'details' ? '#007bff' : '#666'
                        }}
                    >
                        Event Details
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'discussion' ? 'active' : ''}`}
                        onClick={() => setActiveTab('discussion')}
                        style={{
                            padding: '10px 20px',
                            background: activeTab === 'discussion' ? 'white' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'discussion' ? '2px solid #007bff' : 'none',
                            fontWeight: activeTab === 'discussion' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            color: activeTab === 'discussion' ? '#007bff' : '#666'
                        }}
                    >
                        Discussion Forum
                    </button>
                </div>

                {activeTab === 'details' ? (
                    <>
                        <div className="event-description-section">
                            <h2>About This Event</h2>
                            <p>{event.description}</p>
                        </div>

                        <div className="event-info-section">
                            <div className="info-item">
                                <strong>Organizer:</strong> {event.organizerId?.name || 'Unknown'}
                            </div>
                            {event.maxParticipants && (
                                <div className="info-item">
                                    <strong>Max Participants:</strong> {event.maxParticipants}
                                </div>
                            )}
                            {event.maxTeams && (
                                <div className="info-item">
                                    <strong>Max Teams:</strong> {event.maxTeams}
                                </div>
                            )}
                            {event.isTeamEvent && teamsCount !== undefined && (
                                <div className="info-item">
                                    <strong>Teams Registered:</strong> {teamsCount} {event.maxTeams ? `/ ${event.maxTeams}` : ''}
                                </div>
                            )}
                            <div className="info-item">
                                <strong>Status:</strong> {event.status}
                            </div>
                        </div>

                        {/* Price and Stock for Merchandise */}
                        {event.type === 'Merch' && (
                            <div className="merchandise-info">
                                <div className="price-display">
                                    <span className="price-label">Price:</span>
                                    <span className="price-value">₹{event.price || 0}</span>
                                </div>
                                <div className="stock-display">
                                    {event.stock === null ? (
                                        <span className="stock-unlimited">✓ Unlimited Stock Available</span>
                                    ) : event.stock > 0 ? (
                                        <span className="stock-available">✓ {event.stock} in stock</span>
                                    ) : (
                                        <span className="stock-out">✗ Out of Stock</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {user && user.role === 'Participant' && (
                            <>
                                {registered ? (
                                    <div className="already-registered">
                                        <h3>✓ You're Registered!</h3>
                                        <p>You have already registered for this event.</p>
                                        <button
                                            onClick={() => navigate('/my-registrations')}
                                            className="view-registrations-button"
                                        >
                                            View My Registrations
                                        </button>
                                    </div>
                                ) : isEventPast() ? (
                                    <div className="registration-closed">
                                        <h3>Registration Closed</h3>
                                        <p>This event has already passed.</p>
                                    </div>
                                ) : !event.isTeamEvent && event.maxParticipants && participantsCount >= event.maxParticipants ? (
                                    <div className="registration-closed">
                                        <h3>Registration Full</h3>
                                        <p>This event has reached its maximum participant limit.</p>
                                    </div>
                                ) : (
                                    <div className="registration-section">
                                        {renderRegistrationSection()}
                                    </div>
                                )}
                            </>
                        )}

                        {(!user || user.role !== 'Participant') && (
                            <div className="login-prompt">
                                <p>Please login as a participant to register for this event.</p>
                                <button onClick={() => navigate('/login')} className="login-button">
                                    Login
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="discussion-section">
                        {!user ? (
                            <div className="login-prompt">
                                <p>Please login to join the discussion.</p>
                                <button onClick={() => navigate('/login')} className="login-button">Login</button>
                            </div>
                        ) : (
                            <ChatBox
                                roomId={event._id}
                                userId={user.id}
                                userName={user.name}
                                title={`Discussion: ${event.name}`}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventDetails;
