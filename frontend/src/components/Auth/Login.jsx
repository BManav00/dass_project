import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { setToken, setUser } from '../../utils/auth';
import './Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error on input change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.email || !formData.password) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/api/auth/login', {
                email: formData.email,
                password: formData.password
            });

            // Store token and user info
            setToken(response.data.token);
            setUser(response.data.user);

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Login failed. Please check your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <button onClick={() => navigate('/')} className="back-to-home-button">
                ← Back to Home
            </button>
            <div className="auth-card">
                <h2>Login</h2>
                <p className="auth-subtitle">Welcome back to IIIT Events</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="yourname@iiit.ac.in"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?{' '}
                    <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>
                        Sign up here
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Login;
