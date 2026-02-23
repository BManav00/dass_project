import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { setToken, setUser } from '../../utils/auth';
import './Auth.css';

const Signup = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('iiit'); // 'iiit' or 'guest'

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        studentId: '',
        department: '',
        year: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const validateEmail = (email) => {
        if (activeTab === 'iiit') {
            const iiitEmailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*iiit\.ac\.in$/i;
            return iiitEmailRegex.test(email);
        }
        // Basic email validation for guest
        return /^\S+@\S+\.\S+$/.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Common Validation
        if (!formData.name || !formData.email || !formData.password) {
            setError('Please fill in all required fields');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        // Tab Specific Validation
        if (activeTab === 'iiit') {
            if (!validateEmail(formData.email)) {
                setError('Please use a valid IIIT email address (@*.iiit.ac.in)');
                return;
            }
            if (!formData.studentId || !formData.year || !formData.department) {
                setError('Please provide Student ID, Batch/Year, and Department');
                return;
            }
        } else {
            // Guest validation
            if (!validateEmail(formData.email)) {
                setError('Please provide a valid email address');
                return;
            }
        }

        setLoading(true);

        try {
            const isIIIT = activeTab === 'iiit';
            const metadata = {};

            if (isIIIT) {
                metadata.studentId = formData.studentId;
                metadata.department = formData.department;
                metadata.year = parseInt(formData.year);
            }

            const response = await api.post('/api/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                isIIIT,
                metadata
            });

            // Store user and token
            const { user: userData, token } = response.data;
            setToken(token);
            setUser(userData);

            // Participants go to onboarding, others to dashboard
            if (userData.role === 'Participant') {
                navigate('/onboarding');
            } else {
                navigate(userData.role === 'Admin' ? '/admin' : '/organizer');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <button onClick={() => navigate('/')} className="back-to-home-button">
                ← Back to Home
            </button>
            <div className="auth-card" style={{ maxWidth: activeTab === 'iiit' ? '500px' : '400px' }}>
                <h2>Sign Up</h2>
                <div className="tabs" style={{ display: 'flex', marginBottom: '1.5rem', borderBottom: '2px solid #eee' }}>
                    <button
                        className={`tab-btn ${activeTab === 'iiit' ? 'active' : ''}`}
                        onClick={() => setActiveTab('iiit')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            background: activeTab === 'iiit' ? '#007bff' : 'transparent',
                            color: activeTab === 'iiit' ? 'white' : '#1a1a1a',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            borderTopLeftRadius: '4px'
                        }}
                    >
                        IIIT Student
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'guest' ? 'active' : ''}`}
                        onClick={() => setActiveTab('guest')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            background: activeTab === 'guest' ? '#6c757d' : 'transparent',
                            color: activeTab === 'guest' ? 'white' : '#1a1a1a',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            borderTopRightRadius: '4px'
                        }}
                    >
                        Guest (Non-IIIT)
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Full Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">
                            {activeTab === 'iiit' ? 'IIIT Email (@*.iiit.ac.in) *' : 'Email Address *'}
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={activeTab === 'iiit' ? 'user@students.iiit.ac.in' : 'user@example.com'}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="At least 6 characters"
                            required
                        />
                    </div>

                    {activeTab === 'iiit' && (
                        <>
                            <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label htmlFor="studentId">Student ID *</label>
                                    <input
                                        type="text"
                                        id="studentId"
                                        name="studentId"
                                        value={formData.studentId}
                                        onChange={handleChange}
                                        placeholder="202XXXXX"
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label htmlFor="year">Batch/Year *</label>
                                    <input
                                        type="number"
                                        id="year"
                                        name="year"
                                        value={formData.year}
                                        onChange={handleChange}
                                        placeholder="e.g. 2024"
                                        required
                                        min="2000"
                                        max="2030"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="department">Branch/Department *</label>
                                <input
                                    type="text"
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    placeholder="e.g. CSE, ECE"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'guest' && (
                        <div className="info-box" style={{ padding: '12px', background: '#f0f0f0', borderRadius: '4px', fontSize: '0.85rem', color: '#111', marginBottom: '1rem', border: '1px solid #ccc' }}>
                            <p style={{ margin: 0 }}>Note: Guest accounts allow multiple users with the same email, but each must have a unique password to identify them.</p>
                        </div>
                    )}

                    <button type="submit" className="auth-button" disabled={loading} style={{ background: activeTab === 'iiit' ? '#007bff' : '#6c757d' }}>
                        {loading ? 'Creating Account...' : (activeTab === 'iiit' ? 'Register as Student' : 'Register as Guest')}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account?{' '}
                    <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                        Login here
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Signup;
