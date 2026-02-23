import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './Clubs.css';

const Clubs = () => {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [user, setUser] = useState(getUser());
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrganizers();
        refreshUser();
    }, []);

    const fetchOrganizers = async () => {
        try {
            const response = await api.get('/api/users/organizers');
            setOrganizers(response.data);
        } catch (err) {
            console.error('Fetch organizers error:', err);
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

    const handleFollow = async (id, e) => {
        e.stopPropagation();
        try {
            await api.post(`/api/users/follow/${id}`);
            // Optimistic update or refresh
            const updatedFollowed = user.followedClubs.includes(id)
                ? user.followedClubs.filter(clubId => clubId !== id)
                : [...user.followedClubs, id];

            setUser({ ...user, followedClubs: updatedFollowed });
        } catch (err) {
            console.error('Follow error:', err);
        }
    };

    const filteredOrganizers = organizers.filter(org => {
        const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (org.metadata?.description && org.metadata.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = filterCategory === 'all' || org.metadata?.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', ...new Set(organizers.map(org => org.metadata?.category).filter(Boolean))];

    if (loading) return <div className="loading">Loading clubs...</div>;

    return (
        <div className="clubs-container">
            <div className="clubs-header">
                <h1>Clubs & Organizers</h1>
                <p>Follow your favorite clubs to stay updated on their latest events.</p>
            </div>

            <div className="clubs-filters">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search clubs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="category-select"
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>
                            {cat === 'all' ? 'All Categories' : cat}
                        </option>
                    ))}
                </select>
            </div>

            <div className="clubs-grid">
                {filteredOrganizers.length > 0 ? (
                    filteredOrganizers.map(org => (
                        <div
                            key={org._id}
                            className="club-card"
                            onClick={() => navigate(`/clubs/${org._id}`)}
                        >
                            <div className="club-info">
                                <h3>{org.name}</h3>
                                <span className="club-category">{org.metadata?.category || 'Organizer'}</span>
                                <p className="club-description">
                                    {org.metadata?.description || 'No description available.'}
                                </p>
                            </div>
                            <div className="club-actions">
                                <button
                                    className={`follow-btn ${user?.followedClubs?.includes(org._id) ? 'following' : ''}`}
                                    onClick={(e) => handleFollow(org._id, e)}
                                >
                                    {user?.followedClubs?.includes(org._id) ? 'Following' : 'Follow'}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <p>No clubs found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Clubs;
