import { useNavigate } from 'react-router-dom';
import './Home.css';
import mascotImg from '../assets/mascot.svg';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className="home-content">
                <h1>FELICITY MANAGEMENT SYSTEM</h1>
                <p className="home-subtitle">Manage and participate in campus events seamlessly</p>

                <div className="mascot-container">
                    <img src={mascotImg} alt="Felicity Mascot" className="mascot-image" />
                </div>

                <div className="home-buttons">
                    <button onClick={() => navigate('/login')} className="home-button primary">
                        Login
                    </button>
                    <button onClick={() => navigate('/signup')} className="home-button secondary">
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Home;
