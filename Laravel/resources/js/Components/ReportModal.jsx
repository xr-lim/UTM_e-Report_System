import React, { useState, useEffect } from 'react';

export default function ReportModal({ isOpen, onClose, report, onUpdate }) {
    const [status, setStatus] = useState('Received');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (report) {
            setStatus(report.status || 'Received');
            setNotes(report.notes || '');
        }
    }, [report]);

    if (!isOpen || !report) return null;

    const handleSubmit = async () => {
        setLoading(true);
        await onUpdate(report.id, { status, notes });
        setLoading(false);
        onClose();
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-title">Process Photo Report</div>

                <div className="form-group">
                    <label>Report ID</label>
                    <input type="text" value={report.reportId || report.id} readOnly style={{ background: '#f5f5f5' }} />
                </div>

                <div className="form-group">
                    <label>Photo Processing Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="Received">Received</option>
                        <option value="Processed">Processed</option>
                        <option value="Verified">Verified</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Processing Notes</label>
                    <textarea
                        rows="4"
                        placeholder="Add notes about this violation..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                </div>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        style={{ width: 'auto' }}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update Status'}
                    </button>
                </div>
            </div>
        </div>
    );
}
