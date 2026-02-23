import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './OrganizerEventDetail.css';

const OrganizerEventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = getUser();
    const [event, setEvent] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAttendance, setFilterAttendance] = useState('all');
    const [selectedParticipant, setSelectedParticipant] = useState(null);

    useEffect(() => {
        fetchEventData();
    }, [id]);

    const fetchEventData = async () => {
        try {
            setLoading(true);
            const [eventRes, analyticsRes, participantsRes] = await Promise.all([
                api.get(`/api/events/${id}`),
                api.get(`/api/events/${id}/analytics`),
                api.get(`/api/events/${id}/participants`)
            ]);

            setEvent(eventRes.data.event);
            setAnalytics(analyticsRes.data);
            setParticipants(participantsRes.data.participants);
        } catch (err) {
            console.error('Fetch event detail error:', err);
            setError('Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        try {
            await api.put(`/api/events/${id}`, { status: newStatus });
            fetchEventData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const exportToCSV = () => {
        if (!participants || participants.length === 0) return;

        const headers = ['Name', 'Email', 'Team', 'Registered At', 'Attendance', 'Status'];
        const csvRows = [headers.join(',')];

        filteredParticipants.forEach(p => {
            const row = [
                `"${p.user.name}"`,
                `"${p.user.email}"`,
                `"${p.teamName || 'N/A'}"`,
                new Date(p.registeredAt).toLocaleDateString(),
                p.checkedIn ? 'Present' : 'Absent',
                p.status
            ];
            csvRows.push(row.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `participants_${event.name.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (loading) return <div className="loading-container">Loading...</div>;
    if (error) return <div className="error-container">{error}</div>;

    const filteredParticipants = participants.filter(p => {
        const matchesSearch = p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAttendance = filterAttendance === 'all' ||
            (filterAttendance === 'present' ? p.checkedIn : !p.checkedIn);
        return matchesSearch && matchesAttendance;
    });

    return (
        <div className="event-detail-organizer">
            <div className="breadcrumb">
                <button onClick={() => navigate('/organizer')}>← Back to Dashboard</button>
            </div>

            <div className="detail-grid">
                {/* Overview Section */}
                <div className="section-card overview">
                    <div className="section-header">
                        <h2>📌 Event Overview</h2>
                        <div className="action-btns">
                            {event.status === 'Draft' && (
                                <button onClick={() => handleUpdateStatus('Published')} className="publish-btn">Publish Event</button>
                            )}
                            {event.status === 'Published' && (
                                <button onClick={() => handleUpdateStatus('Ongoing')} className="ongoing-btn">Start Event</button>
                            )}
                            {event.status === 'Ongoing' && (
                                <button onClick={() => handleUpdateStatus('Completed')} className="complete-btn">Mark Completed</button>
                            )}
                        </div>
                    </div>
                    <div className="overview-table">
                        <div className="ov-row"><span>Status</span><span className={`status-tag ${event.status.toLowerCase()}`}>{event.status}</span></div>
                        <div className="ov-row"><span>Type</span><span>{event.type}</span></div>
                        <div className="ov-row"><span>Start Date</span><span>{new Date(event.startDate).toLocaleString()}</span></div>
                        <div className="ov-row"><span>End Date</span><span>{new Date(event.endDate).toLocaleString()}</span></div>
                        <div className="ov-row"><span>Reg. Deadline</span><span>{new Date(event.registrationDeadline).toLocaleString()}</span></div>
                        <div className="ov-row"><span>Eligibility</span><span>{event.eligibility}</span></div>
                        <div className="ov-row"><span>Price</span><span>{event.price > 0 ? `₹${event.price}` : 'Free'}</span></div>
                        <div className="ov-row"><span>Capacity</span><span>{event.maxParticipants || 'Unlimited'}</span></div>
                        {event.tags && event.tags.length > 0 && (
                            <div className="ov-row">
                                <span>Tags</span>
                                <div className="event-tags">
                                    {event.tags.map(tag => <span key={tag} className="tag-badge">{tag}</span>)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Analytics Section */}
                <div className="section-card analytics">
                    <h2>📊 Event Analytics</h2>
                    <div className="analytics-stats-grid">
                        <div className="stat-box">
                            <span className="stat-val">{analytics.overview.totalRegistrations}</span>
                            <span className="stat-lab">Registrations</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-val">₹{analytics.overview.totalRevenue.toLocaleString()}</span>
                            <span className="stat-lab">Revenue</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-val">{analytics.overview.totalAttendance}</span>
                            <span className="stat-lab">Attendance</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-val">{analytics.overview.attendanceRate}%</span>
                            <span className="stat-lab">Rel. Rate</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Participants Section */}
            <div className="section-card wide">
                <div className="section-header">
                    <h2>👥 Participant Management</h2>
                    <div className="management-actions">
                        <input
                            type="text"
                            placeholder="Search by name/email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <select
                            value={filterAttendance}
                            onChange={(e) => setFilterAttendance(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Attendance</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                        </select>
                        <button onClick={exportToCSV} className="export-btn">📥 Export CSV</button>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Team</th>
                                <th>Registered</th>
                                <th>Attendance</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParticipants.map(participant => (
                                <tr key={participant.ticketId}>
                                    <td>{participant.user.name}</td>
                                    <td>{participant.user.email}</td>
                                    <td>{participant.teamName || '-'}</td>
                                    <td>{new Date(participant.registeredAt).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`att-tag ${participant.checkedIn ? 'present' : 'absent'}`}>
                                            {participant.checkedIn ? 'Present' : 'Absent'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => setSelectedParticipant(participant)}
                                            className="view-answers-btn"
                                        >
                                            View Answers
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredParticipants.length === 0 && (
                        <div className="no-results">No participants found matching your criteria.</div>
                    )}
                </div>
            </div>

            {/* Answers Modal */}
            {selectedParticipant && (
                <div className="modal-overlay" onClick={() => setSelectedParticipant(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Responses: {selectedParticipant.user.name}</h3>
                            <button
                                className="close-modal-btn"
                                onClick={() => setSelectedParticipant(null)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-body">
                            {selectedParticipant.answers && selectedParticipant.answers.length > 0 ? (
                                selectedParticipant.answers.map((ans, idx) => (
                                    <div key={idx} className="answer-item">
                                        <span className="ans-label">{ans.label}</span>
                                        <span className="ans-value">
                                            {Array.isArray(ans.value) ? ans.value.join(', ') : String(ans.value)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="no-results">No form responses found for this participant.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizerEventDetail;
