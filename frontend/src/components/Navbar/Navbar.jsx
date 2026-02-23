import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getUser, logout, isAuthenticated } from '../../utils/auth';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getUser();
    const isAuth = isAuthenticated();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!isAuth) return null;

    const navLinks = [
        { name: 'Dashboard', path: '/dashboard', roles: ['Participant'] },
        { name: 'Dashboard', path: '/admin', roles: ['Admin'] },
        { name: 'Dashboard', path: '/organizer', roles: ['Organizer'] },
        { name: 'Create Event', path: '/organizer/create-event', roles: ['Organizer'] },
        { name: 'Ongoing Events', path: '/organizer/ongoing', roles: ['Organizer'] },
        { name: 'Browse Events', path: '/events', roles: ['Participant', 'Organizer', 'Admin'] },
        { name: 'Clubs', path: '/clubs', roles: ['Participant', 'Admin'] },
        { name: 'Profile', path: '/profile', roles: ['Participant', 'Organizer', 'Admin'] },
    ];

    const filteredLinks = navLinks.filter(link => link.roles.includes(user?.role));

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    Felicity MGMT
                </Link>

                <div className="nav-menu">
                    {filteredLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`nav-item ${location.pathname === link.path ? 'active' : ''}`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                <div className="nav-user">
                    <span className="user-name">{user?.name}</span>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
