import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getUser } from '../utils/auth';
import api from '../api/axios';
import './OrganizerDashboard.css'; // Reusing styles

const OrganizerScan = () => {
    const navigate = useNavigate();
    const user = getUser();
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState('');
    const [scanning, setScanning] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'Organizer') {
            navigate('/dashboard');
            return;
        }

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText, decodedResult) {
            // Handle the scanned code as you like, for example:
            console.log(`Code matched = ${decodedText}`, decodedResult);
            handleScan(decodedText);
            scanner.clear();
            setScanning(false);
        }

        function onScanFailure(error) {
            // handle scan failure, usually better to ignore and keep scanning.
            // console.warn(`Code scan error = ${error}`);
        }

        return () => {
            scanner.clear().catch(error => {
                // Failed to clear scanner.
                console.error("Failed to clear html5-qrcode scanner. ", error);
            });
        };
    }, []);

    const handleScan = async (ticketId) => {
        try {
            setError('');
            const response = await api.post('/api/tickets/scan', { ticketId });
            setScanResult({
                status: 'success',
                message: response.data.message,
                ticket: response.data.ticket
            });
        } catch (err) {
            console.error('Scan error:', err);
            setScanResult({
                status: 'error',
                message: err.response?.data?.message || 'Failed to verify ticket'
            });
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setScanning(true);
        window.location.reload(); // Simple reload to restart scanner cleanly
    };

    return (
        <div className="organizer-dashboard">
            <div className="dashboard-header">
                <h1>QR Code Scanner</h1>
                <button onClick={() => navigate('/organizer/dashboard')} className="create-event-btn">
                    Back to Dashboard
                </button>
            </div>

            <div className="scan-container" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                {!scanResult ? (
                    <div id="reader"></div>
                ) : (
                    <div className={`scan-result ${scanResult.status}`}>
                        <div style={{
                            padding: '2rem',
                            borderRadius: '12px',
                            background: scanResult.status === 'success' ? '#e8f5e9' : '#ffebee',
                            color: scanResult.status === 'success' ? '#2e7d32' : '#c62828',
                            border: `2px solid ${scanResult.status === 'success' ? '#2e7d32' : '#c62828'}`
                        }}>
                            <h2>{scanResult.status === 'success' ? '✅ Check-in Successful' : '❌ Check-in Failed'}</h2>
                            <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>{scanResult.message}</p>

                            {scanResult.ticket && (
                                <div style={{ textAlign: 'left', marginTop: '1rem', background: 'white', padding: '1rem', borderRadius: '8px' }}>
                                    <p><strong>Ticket ID:</strong> {scanResult.ticket.id}</p>
                                    <p><strong>Time:</strong> {new Date(scanResult.ticket.checkInTime).toLocaleString()}</p>
                                </div>
                            )}

                            <button
                                onClick={resetScanner}
                                style={{
                                    marginTop: '2rem',
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    background: '#333',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Scan Next Ticket
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizerScan;
