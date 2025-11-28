import React, { useState } from 'react';
import { useReports } from '../hooks/useReports';

export default function ReportHistory() {
    const { reports, loading } = useReports();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const filteredReports = reports.filter(report => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = (
            (report.reportId || report.id).toLowerCase().includes(search) ||
            report.plate.toLowerCase().includes(search) ||
            report.location.toLowerCase().includes(search)
        );

        const matchesStatus = !statusFilter || report.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleExport = () => {
        const headers = ['Report ID', 'Plate', 'Location', 'Date', 'Violation', 'Status', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...filteredReports.map(r => [
                r.reportId || r.id,
                r.plate,
                `"${r.location}"`,
                r.date && r.date.seconds ? new Date(r.date.seconds * 1000).toISOString() : r.date,
                r.violation,
                r.status,
                `"${r.notes || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `utm-report-history-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    return (
        <div className="main">
            <div className="page-title">Report History</div>

            <div className="search-section">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                >
                    <option value="">All Status</option>
                    <option value="Received">Received</option>
                    <option value="Processed">Processed</option>
                    <option value="Verified">Verified</option>
                </select>

                <button className="view-btn" onClick={handleExport}>
                    Export CSV
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Report ID</th>
                            <th>Plate</th>
                            <th>Location</th>
                            <th>Violation</th>
                            <th>Status</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReports.map(report => (
                            <tr key={report.id}>
                                <td>
                                    {report.date && report.date.seconds
                                        ? new Date(report.date.seconds * 1000).toLocaleDateString()
                                        : new Date(report.date).toLocaleDateString()}
                                </td>
                                <td>{report.reportId || report.id}</td>
                                <td><strong>{report.plate}</strong></td>
                                <td>{report.location}</td>
                                <td>{report.violation}</td>
                                <td>
                                    <span className={`status-badge status-${report.status.toLowerCase()}`}>
                                        {report.status}
                                    </span>
                                </td>
                                <td>{report.notes || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
