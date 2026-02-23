import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import './CreateEvent.css';

const CreateEvent = () => {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            fetchEventData();
        }
    }, [id]);

    const fetchEventData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/events/${id}`);
            const event = response.data.event;

            setEventData({
                name: event.name || '',
                description: event.description || '',
                type: event.type || 'Normal',
                startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
                endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
                registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().slice(0, 16) : '',
                eligibility: event.eligibility || 'All',
                tags: event.tags ? event.tags.join(', ') : '',
                maxParticipants: event.maxParticipants || '',
                isTeamEvent: event.isTeamEvent || false,
                minTeamSize: event.minTeamSize || 1,
                maxTeamSize: event.maxTeamSize || 5,
                maxTeams: event.maxTeams || '',
                price: event.price || 0,
                stock: event.stock || 0
            });
            setFormFields(event.formFields || []);

            // Check if form should be locked
            if (event.participants && event.participants.length > 0) {
                setIsLocked(true);
            }
        } catch (err) {
            setError('Failed to load event data');
        } finally {
            setLoading(false);
        }
    };

    const [eventData, setEventData] = useState({
        name: '',
        description: '',
        type: 'Normal',
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        eligibility: 'All',
        tags: '',
        maxParticipants: '',
        isTeamEvent: false,
        minTeamSize: 1,
        maxTeamSize: 5,
        maxTeams: '',
        price: '',
        stock: ''
    });

    const [formFields, setFormFields] = useState([]);
    const [showFieldBuilder, setShowFieldBuilder] = useState(false);
    const [currentField, setCurrentField] = useState({
        label: '',
        fieldType: 'text',
        placeholder: '',
        required: false,
        options: []
    });

    const handleEventChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEventData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFieldChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentField(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddOption = () => {
        setCurrentField(prev => ({
            ...prev,
            options: [...prev.options, '']
        }));
    };

    const handleOptionChange = (index, value) => {
        setCurrentField(prev => ({
            ...prev,
            options: prev.options.map((opt, i) => i === index ? value : opt)
        }));
    };

    const handleRemoveOption = (index) => {
        setCurrentField(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }));
    };

    const handleAddField = () => {
        if (!currentField.label) {
            alert('Please provide a field label');
            return;
        }

        if (['select', 'radio', 'checkbox'].includes(currentField.fieldType)) {
            const validOptions = currentField.options.filter(opt => opt.trim() !== '');
            if (validOptions.length === 0) {
                alert('Please add at least one option for this field type');
                return;
            }
            currentField.options = validOptions;
        }

        setFormFields(prev => [...prev, { ...currentField }]);

        // Reset current field
        setCurrentField({
            label: '',
            fieldType: 'text',
            placeholder: '',
            required: false,
            options: []
        });
        setShowFieldBuilder(false);
    };

    const handleRemoveField = (index) => {
        setFormFields(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Prepare payload
            const isMerch = eventData.type === 'Merch';

            // Handle stock: empty string = null (unlimited), "0" = 0
            let stock = null;
            if (isMerch && eventData.stock !== '' && eventData.stock !== null && eventData.stock !== undefined) {
                stock = parseInt(eventData.stock);
            }

            // Handle price: default 0
            let price = 0;
            if (isMerch && eventData.price) {
                price = parseFloat(eventData.price);
            }

            const payload = {
                ...eventData,
                tags: eventData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
                formFields,
                maxParticipants: !isMerch && !eventData.isTeamEvent && eventData.maxParticipants ? parseInt(eventData.maxParticipants) : null,
                maxTeams: eventData.isTeamEvent && eventData.maxTeams ? parseInt(eventData.maxTeams) : null,
                price,
                stock
            };

            // Validation
            if (new Date(payload.startDate) >= new Date(payload.endDate)) {
                setError('Event end date must be after the start date');
                setLoading(false);
                return;
            }
            if (new Date(payload.registrationDeadline) > new Date(payload.startDate)) {
                setError('Registration deadline cannot be after the event start date');
                setLoading(false);
                return;
            }

            if (isEditMode) {
                await api.put(`/api/events/${id}`, payload);
                alert('Event updated successfully');
                navigate(`/organizer/events/${id}`);
            } else {
                await api.post('/api/events', payload);
                alert('Event created successfully as Draft');
                navigate('/organizer');
            }
        } catch (err) {
            console.error('Submit event error:', err);
            setError(err.response?.data?.message || 'Failed to save event');
        } finally {
            setLoading(false);
        }
    };

    const fieldTypeOptions = [
        { value: 'text', label: 'Text Input' },
        { value: 'email', label: 'Email' },
        { value: 'number', label: 'Number' },
        { value: 'textarea', label: 'Text Area' },
        { value: 'select', label: 'Dropdown' },
        { value: 'radio', label: 'Radio Buttons' },
        { value: 'checkbox', label: 'Checkboxes' },
        { value: 'date', label: 'Date' }
    ];

    const needsOptions = ['select', 'radio', 'checkbox'].includes(currentField.fieldType);

    return (
        <div className="create-event-container">
            <div className="create-event-header">
                <button onClick={() => navigate('/organizer/dashboard')} className="back-button">
                    ← Back to Dashboard
                </button>
                <h1>Create New Event</h1>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="create-event-form">
                {/* Basic Event Information */}
                <div className="form-section">
                    <h2>📋 Event Details</h2>

                    <div className="form-group">
                        <label htmlFor="name">Event Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={eventData.name}
                            onChange={handleEventChange}
                            required
                            placeholder="e.g., Hackathon 2026"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description *</label>
                        <textarea
                            id="description"
                            name="description"
                            value={eventData.description}
                            onChange={handleEventChange}
                            required
                            rows="4"
                            placeholder="Describe your event..."
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="startDate">Start Date *</label>
                            <input
                                type="datetime-local"
                                id="startDate"
                                name="startDate"
                                value={eventData.startDate}
                                onChange={handleEventChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="endDate">End Date *</label>
                            <input
                                type="datetime-local"
                                id="endDate"
                                name="endDate"
                                value={eventData.endDate}
                                onChange={handleEventChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="registrationDeadline">Registration Deadline *</label>
                            <input
                                type="datetime-local"
                                id="registrationDeadline"
                                name="registrationDeadline"
                                value={eventData.registrationDeadline}
                                onChange={handleEventChange}
                                required
                                title="Participants cannot register after this date"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="eligibility">Eligibility *</label>
                            <select
                                id="eligibility"
                                name="eligibility"
                                value={eventData.eligibility}
                                onChange={handleEventChange}
                                required
                            >
                                <option value="All">All (Public)</option>
                                <option value="IIIT">IIIT Only</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="tags">Event Tags (Comma separated)</label>
                            <input
                                type="text"
                                id="tags"
                                name="tags"
                                value={eventData.tags}
                                onChange={handleEventChange}
                                placeholder="e.g. Workshop, Coding, Tech"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="type">Event Type *</label>
                            <select
                                id="type"
                                name="type"
                                value={eventData.type}
                                onChange={handleEventChange}
                                required
                            >
                                <option value="Normal">Normal</option>
                                <option value="Merch">Merch</option>
                            </select>
                        </div>

                        {/* Hide Max Participants for Merch - replaced by Stock */}
                        {/* Hide Max Participants for Merch - replaced by Stock */}
                        {eventData.type !== 'Merch' && (
                            <>
                                <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id="isTeamEvent"
                                        name="isTeamEvent"
                                        checked={eventData.isTeamEvent}
                                        onChange={handleEventChange}
                                        style={{ width: 'auto', marginRight: '10px' }}
                                    />
                                    <label htmlFor="isTeamEvent" style={{ margin: 0 }}>Is this a Team Event?</label>
                                </div>

                                {!eventData.isTeamEvent ? (
                                    <div className="form-group">
                                        <label htmlFor="maxParticipants">Max Participants (Total)</label>
                                        <input
                                            type="number"
                                            id="maxParticipants"
                                            name="maxParticipants"
                                            value={eventData.maxParticipants}
                                            onChange={handleEventChange}
                                            placeholder="Leave empty for unlimited"
                                            min="1"
                                        />
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label htmlFor="maxTeams">Max Number of Teams</label>
                                        <input
                                            type="number"
                                            id="maxTeams"
                                            name="maxTeams"
                                            value={eventData.maxTeams || ''}
                                            onChange={handleEventChange}
                                            placeholder="Leave empty for unlimited"
                                            min="1"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Team Settings */}
                    {eventData.type !== 'Merch' && eventData.isTeamEvent && (
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="minTeamSize">Min Team Size</label>
                                <input
                                    type="number"
                                    id="minTeamSize"
                                    name="minTeamSize"
                                    value={eventData.minTeamSize}
                                    onChange={handleEventChange}
                                    min="1"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="maxTeamSize">Max Team Size</label>
                                <input
                                    type="number"
                                    id="maxTeamSize"
                                    name="maxTeamSize"
                                    value={eventData.maxTeamSize}
                                    onChange={handleEventChange}
                                    min="1"
                                />
                            </div>
                        </div>
                    )}

                    {/* Merchandise-specific fields */}
                    {eventData.type === 'Merch' && (
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="stock">Quantity (Stock)</label>
                                <input
                                    type="number"
                                    id="stock"
                                    name="stock"
                                    value={eventData.stock || ''}
                                    onChange={handleEventChange}
                                    placeholder="Leave empty for unlimited"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="price">Price (₹) *</label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={eventData.price || ''}
                                    onChange={handleEventChange}
                                    placeholder="Enter price"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Form Builder Section */}
                <div className="form-section">
                    <div className="section-header">
                        <h3>📝 Custom Registration Questions</h3>
                        {!isLocked && (
                            <button
                                type="button"
                                className="add-field-btn"
                                onClick={() => setShowFieldBuilder(true)}
                            >
                                + Add Question
                            </button>
                        )}
                    </div>

                    {isLocked && (
                        <div className="lock-notice">
                            ⚠️ Registration has started. Form fields are locked to maintain data integrity.
                        </div>
                    )}

                    {/* Display existing fields */}
                    {formFields.length > 0 && (
                        <div className="fields-list">
                            {formFields.map((field, index) => (
                                <div key={index} className="field-item">
                                    <div className="field-info">
                                        <span className="field-label">{field.label}</span>
                                        <span className="field-type">{field.fieldType}</span>
                                        {field.required && <span className="field-required">Required</span>}
                                    </div>
                                    {!isLocked && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveField(index)}
                                            className="remove-field-btn"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Field Builder */}
                    {showFieldBuilder && !isLocked && (
                        <div className="field-builder">
                            <h3>Add New Field</h3>

                            <div className="form-group">
                                <label htmlFor="fieldLabel">Field Label *</label>
                                <input
                                    type="text"
                                    id="fieldLabel"
                                    name="label"
                                    value={currentField.label}
                                    onChange={handleFieldChange}
                                    placeholder="e.g., Dietary Restrictions"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="fieldType">Field Type *</label>
                                    <select
                                        id="fieldType"
                                        name="fieldType"
                                        value={currentField.fieldType}
                                        onChange={handleFieldChange}
                                    >
                                        <option value="text">Short Answer</option>
                                        <option value="textarea">Paragraph</option>
                                        <option value="select">Dropdown</option>
                                        <option value="radio">Multiple Choice</option>
                                        <option value="checkbox">Checkboxes</option>
                                        <option value="number">Number</option>
                                        <option value="file">File Upload</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="placeholder">Placeholder</label>
                                    <input
                                        type="text"
                                        id="placeholder"
                                        name="placeholder"
                                        value={currentField.placeholder}
                                        onChange={handleFieldChange}
                                        placeholder="Optional placeholder text"
                                    />
                                </div>
                            </div>

                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="required"
                                        checked={currentField.required}
                                        onChange={handleFieldChange}
                                    />
                                    <span>Required field</span>
                                </label>
                            </div>

                            {/* Options for select/radio/checkbox */}
                            {needsOptions && (
                                <div className="options-section">
                                    <label>Options *</label>
                                    {currentField.options.map((option, index) => (
                                        <div key={index} className="option-input-group">
                                            <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                                placeholder={`Option ${index + 1}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOption(index)}
                                                className="remove-option-btn"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={handleAddOption}
                                        className="add-option-btn"
                                    >
                                        + Add Option
                                    </button>
                                </div>
                            )}

                            <div className="field-builder-actions">
                                <button
                                    type="button"
                                    onClick={handleAddField}
                                    className="save-field-btn"
                                >
                                    Add Field
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowFieldBuilder(false);
                                        setCurrentField({
                                            label: '',
                                            fieldType: 'text',
                                            placeholder: '',
                                            required: false,
                                            options: []
                                        });
                                    }}
                                    className="cancel-field-btn"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={loading}
                        className="submit-btn"
                    >
                        {loading ? 'Creating Event...' : 'Create Event'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/organizer/dashboard')}
                        className="cancel-btn"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateEvent;
