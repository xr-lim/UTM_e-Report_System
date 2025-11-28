import React from 'react';

export default function ReportTable({ reports, onSelectReport, selectedReportId }) {
    const getStatusInfo = (status) => {
        switch (status) {
            case 'Received': return { class: 'status-received', icon: '📥' };
            case 'Processed': return { class: 'status-processed', icon: '⏳' };
            case 'Verified': return { class: 'status-verified', icon: '✓' };
            default: return { class: 'status-received', icon: '📥' };
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        // Handle Firestore Timestamp
        if (timestamp.seconds) {
            return new Date(timestamp.seconds * 1000).toLocaleString();
        }
        // Handle string or Date object
        return new Date(timestamp).toLocaleString();
    };

    if (!reports || reports.length === 0) {
        return (
            <div className="table-container" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No reports found
            </div>
        );
    }

    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Report ID</th>
                        <th>License Plate</th>
                        <th>Location</th>
                        <th>Date</th>
                        <th>Violation</th>
                        <th>Status</th>
                        <th>Photos</th>
                    </tr>
                </thead>
                <tbody>
                    {reports.map((report, index) => {
                        const statusInfo = getStatusInfo(report.status);
                        return (
                            <tr
                                key={report.id}
                                className={selectedReportId === report.id ? 'selected' : ''}
                                onClick={() => onSelectReport(report)}
                            >
                                <td>{index + 1}</td>
                                <td>{report.reportId || report.id}</td>
                                <td><strong>{report.plate}</strong></td>
                                <td>{report.location}</td>
                                <td>{formatDate(report.date)}</td>
                                <td>{report.violation}</td>
                                <td>
                                    <span className={`status-badge ${statusInfo.class}`}>
                                        <span className="status-dot">{statusInfo.icon}</span>
                                        {report.status}
                                    </span>
                                </td>
                                <td>{report.photoCount || (report.photos ? report.photos.length : 0)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
