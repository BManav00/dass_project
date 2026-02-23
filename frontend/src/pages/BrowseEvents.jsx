import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../utils/auth';
import api from '../api/axios';
import './BrowseEvents.css';

const BrowseEvents = () => {
    const navigate = useNavigate();
    const user = getUser();
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterDate, setFilterDate] = useState('all');

    const [trendingEvents, setTrendingEvents] = useState([]);
    const [filterEligibility, setFilterEligibility] = useState('all');
    const [filterFollowing, setFilterFollowing] = useState(false);

    useEffect(() => {
        fetchEvents();
        fetchTrending();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [events, searchTerm, filterType, filterDate, filterEligibility, filterFollowing]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/events');
            setEvents(response.data.events);
        } catch (err) {
            console.error('Fetch events error:', err);
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const fetchTrending = async () => {
        try {
            const response = await api.get('/api/users/trending-events');
            setTrendingEvents(response.data);
        } catch (err) {
            console.error('Fetch trending error:', err);
        }
    };

    const applyFilters = () => {
        let filtered = [...events];

        // Search filter (fuzzy matching)
        if (searchTerm) {
            const search = searchTerm.toLowerCase().trim();
            if (search) {
                filtered = filtered.filter(event =>
                    (event.name && event.name.toLowerCase().includes(search)) ||
                    (event.description && event.description.toLowerCase().includes(search)) ||
                    (event.organizerId?.name && event.organizerId.name.toLowerCase().includes(search))
                );
            }
        }

        // Type filter
        if (filterType !== 'all') {
            filtered = filtered.filter(event => event.type === filterType);
        }

        // Eligibility filter
        if (filterEligibility !== 'all') {
            filtered = filtered.filter(event => event.eligibility === filterEligibility);
        }

        // Following filter
        if (filterFollowing && user) {
            // This assumes we have user.followedClubs in the user object or we'd need to fetch it
            // For now, let's assume it's in the user object if we updated auth/me
            const followedClubs = user.followedClubs || [];
            filtered = filtered.filter(event => followedClubs.includes(event.organizerId?._id));
        }

        // Scoring and Sorting (Recommendations)
        if (user && user.role === 'Participant') {
            const userInterests = user.interests || [];
            const followedClubs = user.followedClubs || [];

            filtered.sort((a, b) => {
                let scoreA = 0;
                let scoreB = 0;

                // Priority 1: Followed Cluubs
                if (followedClubs.includes(a.organizerId?._id)) scoreA += 10;
                if (followedClubs.includes(b.organizerId?._id)) scoreB += 10;

                // Priority 2: Interest match
                userInterests.forEach(interest => {
                    const interestLower = interest.toLowerCase();
                    if (a.name?.toLowerCase().includes(interestLower) ||
                        a.description?.toLowerCase().includes(interestLower) ||
                        a.type?.toLowerCase() === interestLower) scoreA += 5;

                    if (b.name?.toLowerCase().includes(interestLower) ||
                        b.description?.toLowerCase().includes(interestLower) ||
                        b.type?.toLowerCase() === interestLower) scoreB += 5;
                });

                // Priority 3: Upcoming (closer events first)
                const dateA = new Date(a.startDate).getTime();
                const dateB = new Date(b.startDate).getTime();

                // If scores are equal, sort by date
                if (scoreA === scoreB) {
                    return dateA - dateB;
                }

                return scoreB - scoreA;
            });
        }

        setFilteredEvents(filtered);
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

    const handleEventClick = (eventId) => {
        navigate(`/events/${eventId}`);
    };

    if (loading) {
        return (
            <div className="browse-container">
                <div className="loading">Loading events...</div>
            </div>
        );
    }

    return (
        <div className="browse-container">
            <div className="browse-header">
                <div className="header-content">
                    <div>
                        <h1>Browse Events</h1>
                        <p className="browse-subtitle">Discover and register for upcoming events</p>
                    </div>
                    {user && user.role === 'Participant' && (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="my-tickets-btn"
                        >
                            🎫 My Tickets
                        </button>
                    )}
                </div>
            </div>

            <div className="filters-section">
                <div className="search-box">
                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search events by name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button
                                className="clear-search-btn"
                                onClick={() => setSearchTerm('')}
                                aria-label="Clear search"
                            >
                                ✖
                            </button>
                        )}
                    </div>
                </div>

                <div className="filter-controls">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Types</option>
                        <option value="Normal">Normal</option>
                        <option value="Merch">Merch</option>
                    </select>

                    <select
                        value={filterEligibility}
                        onChange={(e) => setFilterEligibility(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Any Eligibility</option>
                        <option value="IIIT">IIIT Only</option>
                        <option value="All">All Participants</option>
                    </select>

                    <select
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Dates</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                    </select>

                    {user && user.role === 'Participant' && (
                        <label className="checkbox-filter">
                            <input
                                type="checkbox"
                                checked={filterFollowing}
                                onChange={(e) => setFilterFollowing(e.target.checked)}
                            />
                            <span>Followed Clubs</span>
                        </label>
                    )}
                </div>
            </div>

            {trendingEvents.length > 0 && !searchTerm && filterType === 'all' && (
                <div className="trending-section">
                    <div className="section-title">
                        <h2>🔥 Trending (Last 24h)</h2>
                        <p>Most popular events right now</p>
                    </div>
                    <div className="trending-grid">
                        {trendingEvents.map(event => (
                            <div
                                key={event._id}
                                className="trending-card"
                                onClick={() => handleEventClick(event._id)}
                            >
                                <div className="trending-tag">#Trending</div>
                                <h3>{event.name}</h3>
                                <p>{event.organizerId?.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {filteredEvents.length === 0 ? (
                <div className="empty-state">
                    <h3>No events found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="events-grid">
                    {filteredEvents.map(event => (
                        <div
                            key={event._id}
                            className="event-card"
                            onClick={() => handleEventClick(event._id)}
                        >
                            <div className="event-card-header">
                                <h3>{event.name}</h3>
                                <span className={`event-type-badge ${event.type.toLowerCase()}`}>
                                    {event.type}
                                </span>
                            </div>

                            {/* Price tag for merchandise */}
                            {event.type === 'Merch' && (
                                <div className="price-tag">
                                    ₹{event.price || 0}
                                </div>
                            )}

                            <p className="event-description">
                                {event.description.length > 150
                                    ? event.description.substring(0, 150) + '...'
                                    : event.description}
                            </p>

                            <div className="event-card-footer">
                                <div className="event-date">
                                    📅 {formatDate(event.startDate)}
                                </div>
                                {/* Show max participants only for Normal events */}
                                {event.type === 'Normal' && event.maxParticipants && (
                                    <div className="event-capacity">
                                        👥 Max: {event.maxParticipants}
                                    </div>
                                )}
                            </div>

                            {/* Stock display for merchandise */}
                            {event.type === 'Merch' && (
                                <div className="stock-info">
                                    {event.stock === null || event.stock === undefined ? (
                                        <span className="stock-unlimited">✓ Unlimited Stock</span>
                                    ) : event.stock > 0 ? (
                                        <span className="stock-available">
                                            ✓ {event.stock} in stock
                                        </span>
                                    ) : (
                                        <span className="stock-out">Sold Out</span>
                                    )}
                                </div>
                            )}

                            <div className="event-organizer">
                                Organized by: {event.organizerId?.name || 'Unknown'}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BrowseEvents;
