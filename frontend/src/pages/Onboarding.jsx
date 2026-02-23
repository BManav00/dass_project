import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getUser, setUser } from '../utils/auth';
import './Onboarding.css';

const INTERESTS_OPTIONS = [
    'Technical', 'Cultural', 'Sports', 'Photography', 'Art',
    'Music', 'Dance', 'Drama', 'Gaming', 'Writing',
    'Social Service', 'Entrepreneurship', 'Robotics', 'Coding'
];

const Onboarding = () => {
    const navigate = useNavigate();
    const currentUser = getUser();
    const [organizers, setOrganizers] = useState([]);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [followedClubs, setFollowedClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'Participant') {
            navigate('/dashboard');
            return;
        }
        fetchOrganizers();
    }, []);

    const fetchOrganizers = async () => {
        try {
            const response = await api.get('/api/users/organizers');
            setOrganizers(response.data);
        } catch (err) {
            console.error('Failed to fetch clubs:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleInterest = (interest) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(selectedInterests.filter(i => i !== interest));
        } else {
            setSelectedInterests([...selectedInterests, interest]);
        }
    };

    const toggleClub = (clubId) => {
        if (followedClubs.includes(clubId)) {
            setFollowedClubs(followedClubs.filter(id => id !== clubId));
        } else {
            setFollowedClubs([...followedClubs, clubId]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update profile with interests
            const profileResponse = await api.put('/api/users/profile', {
                ...currentUser,
                interests: selectedInterests
            });

            // Follow selected clubs sequentially or in parallel
            await Promise.all(followedClubs.map(id => api.post(`/api/users/follow/${id}`)));

            // Update local user state
            const updatedUser = {
                ...currentUser,
                interests: selectedInterests,
                followedClubs: followedClubs
            };
            setUser(updatedUser);

            navigate('/dashboard');
        } catch (err) {
            console.error('Failed to save preferences:', err);
            alert('Something went wrong while saving your preferences. You can update them at any time from your profile.');
            navigate('/dashboard');
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        navigate('/dashboard');
    };

    if (loading) return <div className="onboarding-container"><div className="loading">Loading personalized experience...</div></div>;

    return (
        <div className="onboarding-container">
            <div className="onboarding-card">
                <div className="onboarding-header">
                    <h1>Welcome, {currentUser.name}!</h1>
                    <p>Let's personalize your experience. These preferences will help us recommend the best events for you.</p>
                </div>

                <div className="onboarding-section">
                    <h2>✨ What are you interested in?</h2>
                    <div className="interests-grid">
                        {INTERESTS_OPTIONS.map(interest => (
                            <div
                                key={interest}
                                className={`interest-item ${selectedInterests.includes(interest) ? 'selected' : ''}`}
                                onClick={() => toggleInterest(interest)}
                            >
                                {interest}
                            </div>
                        ))}
                    </div>
                </div>

                {organizers.length > 0 && (
                    <div className="onboarding-section">
                        <h2>🏢 Clubs to Follow</h2>
                        <div className="clubs-selection-grid">
                            {organizers.slice(0, 6).map(org => (
                                <div
                                    key={org._id}
                                    className={`club-selection-item ${followedClubs.includes(org._id) ? 'selected' : ''}`}
                                >
                                    <div className="club-selection-info">
                                        <h3>{org.name}</h3>
                                        <p>{org.metadata?.category || 'Organizer'}</p>
                                    </div>
                                    <button
                                        className={`follow-toggle ${followedClubs.includes(org._id) ? 'active' : ''}`}
                                        onClick={() => toggleClub(org._id)}
                                    >
                                        {followedClubs.includes(org._id) ? 'Following' : '+ Follow'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="onboarding-actions">
                    <button className="skip-btn" onClick={handleSkip} disabled={saving}>
                        Skip for now
                    </button>
                    <button
                        className="finish-btn"
                        onClick={handleSave}
                        disabled={saving || (selectedInterests.length === 0 && followedClubs.length === 0)}
                    >
                        {saving ? 'Saving...' : 'Finish Onboarding'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
