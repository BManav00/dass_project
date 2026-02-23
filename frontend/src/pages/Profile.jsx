import { useState, useEffect } from 'react';
import api from '../api/axios';
import './Profile.css';

const Profile = () => {
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        contactNumber: '',
        college: '',
        interests: [],
        followedClubs: [],
        category: '',
        description: '',
        email: '',
        name: '',
        role: '',
        isIIIT: false
    });
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [interestInput, setInterestInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/api/users/profile');
            setProfile(response.data);
        } catch (err) {
            console.error('Fetch profile error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put('/api/users/profile', profile);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setProfile(response.data.user);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed' });
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return setMessage({ type: 'error', text: 'Passwords do not match' });
        }
        try {
            await api.post('/api/users/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Change failed' });
        }
    };

    const addInterest = () => {
        if (interestInput.trim() && !profile.interests.includes(interestInput.trim())) {
            setProfile({ ...profile, interests: [...profile.interests, interestInput.trim()] });
            setInterestInput('');
        }
    };

    const removeInterest = (interest) => {
        setProfile({ ...profile, interests: profile.interests.filter(i => i !== interest) });
    };

    const handleUnfollow = async (clubId) => {
        try {
            await api.post(`/api/users/follow/${clubId}`);
            setProfile({
                ...profile,
                followedClubs: profile.followedClubs.filter(club => (club._id || club) !== clubId)
            });
            setMessage({ type: 'success', text: 'Unfollowed club successfully' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to unfollow club' });
        }
    };

    if (loading) return <div className="loading">Loading profile...</div>;

    return (
        <div className="profile-container">
            <h1>User Profile</h1>
            {message.text && (
                <div className={`status-message ${message.type}`}>{message.text}</div>
            )}

            <div className="profile-grid">
                <section className="profile-section">
                    <h2>{profile.role === 'Organizer' ? 'Organizer Details' : 'Personal Information'}</h2>
                    <form onSubmit={handleProfileUpdate}>
                        <div className="form-group">
                            <label>Contact Email (Non-editable)</label>
                            <input type="text" value={profile.email} disabled className="disabled-input" />
                        </div>

                        {profile.role === 'Participant' ? (
                            <>
                                <div className="form-group">
                                    <label>Participant Type</label>
                                    <input type="text" value={profile.isIIIT ? 'IIIT Student' : 'Non-IIIT / Guest'} disabled className="disabled-input" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <input
                                            type="text"
                                            value={profile.firstName || ''}
                                            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input
                                            type="text"
                                            value={profile.lastName || ''}
                                            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Contact Number</label>
                                    <input
                                        type="text"
                                        value={profile.contactNumber || ''}
                                        onChange={(e) => setProfile({ ...profile, contactNumber: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>College/Organization Name</label>
                                    <input
                                        type="text"
                                        value={profile.college || ''}
                                        onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                                    />
                                </div>

                                <h2>Interests</h2>
                                <div className="interests-manager">
                                    <div className="interests-list">
                                        {profile.interests?.map(interest => (
                                            <span key={interest} className="interest-tag">
                                                {interest}
                                                <button type="button" onClick={() => removeInterest(interest)}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="interest-input-group">
                                        <input
                                            type="text"
                                            placeholder="Add an interest..."
                                            value={interestInput}
                                            onChange={(e) => setInterestInput(e.target.value)}
                                        />
                                        <button type="button" onClick={addInterest}>Add</button>
                                    </div>
                                </div>

                                <h2>Followed Clubs</h2>
                                <div className="followed-clubs-section">
                                    {profile.followedClubs?.length > 0 ? (
                                        <div className="followed-clubs-list">
                                            {profile.followedClubs.map(club => (
                                                <div key={club._id} className="followed-club-card">
                                                    <span>{club.name}</span>
                                                    <button
                                                        type="button"
                                                        className="unfollow-btn"
                                                        onClick={() => handleUnfollow(club._id)}
                                                    >
                                                        Unfollow
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="no-clubs-text">You are not following any clubs yet.</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label>Organizer Name</label>
                                    <input
                                        type="text"
                                        value={profile.name || ''}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <input
                                        type="text"
                                        value={profile.category || ''}
                                        onChange={(e) => setProfile({ ...profile, category: e.target.value })}
                                        placeholder="e.g. Technical, Cultural"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Contact Number (Public)</label>
                                    <input
                                        type="text"
                                        value={profile.contactNumber || ''}
                                        onChange={(e) => setProfile({ ...profile, contactNumber: e.target.value })}
                                        placeholder="e.g. +91 9876543210"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Contact Email (Public)</label>
                                    <input
                                        type="email"
                                        value={profile.contactEmail || ''}
                                        onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                                        placeholder="e.g. contact@yourclub.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Discord Webhook URL</label>
                                    <input
                                        type="text"
                                        value={profile.discordWebhook || ''}
                                        onChange={(e) => setProfile({ ...profile, discordWebhook: e.target.value })}
                                        placeholder="https://discord.com/api/webhooks/..."
                                    />
                                    <small style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                                        Receive notifications when you publish new events!
                                    </small>
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={profile.description || ''}
                                        onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                                        placeholder="Tell us about your organization..."
                                        className="profile-textarea"
                                    />
                                </div>
                            </>
                        )}

                        <button type="submit" className="save-btn">Update Profile</button>
                    </form>
                </section>

                <section className="profile-section">
                    <h2>Change Password</h2>
                    <form onSubmit={handlePasswordChange}>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={passwords.currentPassword}
                                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                value={passwords.confirmPassword}
                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="save-btn secondary">Change Password</button>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default Profile;
