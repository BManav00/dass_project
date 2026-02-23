import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getUser, logout } from '../utils/auth';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const user = getUser();

    const [organizers, setOrganizers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        clubName: '',
        description: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState('');

    useEffect(() => {
        fetchOrganizers();
        fetchStats();
    }, []);

    const fetchOrganizers = async () => {
        try {
            const response = await api.get('/api/admin/organizers');
            setOrganizers(response.data.organizers);
            setLoading(false);
        } catch (err) {
            setError('Failed to load organizers');
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/admin/stats');
            setStats(response.data.stats);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const metadata = {};
            if (formData.clubName) metadata.clubName = formData.clubName;
            if (formData.description) metadata.description = formData.description;

            const response = await api.post('/api/admin/organizers', {
                name: formData.name,
                email: formData.email,
                metadata
            });

            setGeneratedPassword(response.data.password);
            setSuccess(`Organizer created! Password: ${response.data.password}`);
            setFormData({ name: '', email: '', clubName: '', description: '' });
            setShowAddForm(false);
            fetchOrganizers();
            fetchStats();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create organizer');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
            return;
        }

        try {
            await api.delete(`/api/admin/organizers/${id}`);
            setSuccess('Organizer deleted successfully');
            fetchOrganizers();
            fetchStats();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete organizer');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p className="admin-subtitle">Welcome, {user?.name}</p>
                </div>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </div>

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalUsers}</div>
                        <div className="stat-label">Total Users</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.participants}</div>
                        <div className="stat-label">Participants</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.organizers}</div>
                        <div className="stat-label">Organizers</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.admins}</div>
                        <div className="stat-label">Admins</div>
                    </div>
                </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}
            {success && (
                <div className="alert alert-success">
                    {success}
                    {generatedPassword && (
                        <div className="password-display">
                            <strong>⚠️ Save this password:</strong> {generatedPassword}
                        </div>
                    )}
                </div>
            )}

            <div className="organizers-section">
                <div className="section-header">
                    <h2>Organizers</h2>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="add-button"
                    >
                        {showAddForm ? 'Cancel' : '+ Add Organizer'}
                    </button>
                </div>

                {showAddForm && (
                    <div className="add-form-card">
                        <h3>Create New Organizer</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g., Coding Club"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="codingclub@iiit.ac.in"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Club Name</label>
                                    <input
                                        type="text"
                                        name="clubName"
                                        value={formData.clubName}
                                        onChange={handleChange}
                                        placeholder="Optional"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="submit-button">
                                Create Organizer
                            </button>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div className="loading">Loading organizers...</div>
                ) : organizers.length === 0 ? (
                    <div className="empty-state">
                        <p>No organizers yet. Create one to get started!</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="organizers-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Club Name</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {organizers.map((org) => (
                                    <tr key={org._id}>
                                        <td>{org.name}</td>
                                        <td>{org.email}</td>
                                        <td>{org.metadata?.clubName || '-'}</td>
                                        <td>{new Date(org.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                onClick={() => handleDelete(org._id, org.name)}
                                                className="delete-button"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
