import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './OrganizerView.css';

const OrganizerView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(getUser());
    const [activeTab, setActiveTab] = useState('upcoming');

    useEffect(() => {
        fetchOrganizerData();
        refreshUser();
    }, [id]);

    const fetchOrganizerData = async () => {
        try {
            const response = await api.get(`/api/users/organizers/${id}`);
            setData(response.data);
        } catch (err) {
            console.error('Fetch organizer data error:', err);
        } finally {
            setLoading(false);
        }
    };

    const refreshUser = async () => {
        try {
            const response = await api.get('/api/users/profile');
            setUser(response.data);
        } catch (err) {
            console.error('Refresh user error:', err);
        }
    };

    const handleFollow = async () => {
        try {
            await api.post(`/api/users/follow/${id}`);
            const updatedFollowed = user.followedClubs.includes(id)
                ? user.followedClubs.filter(clubId => clubId !== id)
                : [...user.followedClubs, id];

            setUser({ ...user, followedClubs: updatedFollowed });
        } catch (err) {
            console.error('Follow error:', err);
        }
    };

    if (loading) return <div className="loading">Loading club profile...</div>;
    if (!data) return <div className="error">Organizer not found.</div>;

    const { organizer, events } = data;
    const now = new Date();

    const upcomingEvents = events.filter(e => new Date(e.startDate) > now);
    const pastEvents = events.filter(e => new Date(e.startDate) <= now);

    const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

    return (
        <div className="organizer-view-container">
            <button className="back-btn" onClick={() => navigate('/clubs')}>
                ← Back to Clubs
            </button>

            <div className="organizer-profile-header">
                <div className="profile-main-info">
                    <h1>{organizer.name}</h1>
                    <span className="profile-category">{organizer.metadata?.category || 'Organizer'}</span>
                    <p className="profile-description">{organizer.metadata?.description}</p>
                    <p className="profile-email">✉ {organizer.email}</p>
                </div>
                <div className="profile-actions">
                    <button
                        className={`follow-btn large ${user?.followedClubs?.includes(id) ? 'following' : ''}`}
                        onClick={handleFollow}
                    >
                        {user?.followedClubs?.includes(id) ? 'Following' : 'Follow Club'}
                    </button>
                </div>
            </div>

            <div className="organizer-events-section">
                <div className="events-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        Upcoming Events ({upcomingEvents.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
                        onClick={() => setActiveTab('past')}
                    >
                        Past Events ({pastEvents.length})
                    </button>
                </div>

                <div className="events-grid">
                    {displayedEvents.length > 0 ? (
                        displayedEvents.map(event => (
                            <div
                                key={event._id}
                                className="event-mini-card"
                                onClick={() => navigate(`/events/${event._id}`)}
                            >
                                <div className="event-date-badge">
                                    {new Date(event.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                </div>
                                <div className="event-info">
                                    <h3>{event.name}</h3>
                                    <p>{event.type}</p>
                                </div>
                                <div className="event-arrow">→</div>
                            </div>
                        ))
                    ) : (
                        <p className="no-events-text">No {activeTab} events found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizerView;
