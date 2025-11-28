import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ReportTable from '../components/ReportTable';
import PhotoPreview from '../components/PhotoPreview';
import SearchBar from '../components/SearchBar';
import ReportModal from '../components/ReportModal';
import { useReports, useReportStats, useUpdateReport } from '../hooks/useReports';

export default function ReportDashboard() {
    const { reports, loading, error } = useReports();
    const stats = useReportStats(reports);
    const { updateReport } = useUpdateReport();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const itemsPerPage = 10;

    // Filter reports
    const filteredReports = reports.filter(report =>
        (report.reportId || report.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleReportSelect = (report) => {
        setSelectedReport(report);
    };

    const handleDownloadPhotos = (url, filename) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${filename}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = () => {
        // Simple CSV export
        const headers = ['Report ID', 'Plate', 'Location', 'Date', 'Violation', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filteredReports.map(r => [
                r.reportId || r.id,
                r.plate,
                `"${r.location}"`,
                r.date && r.date.seconds ? new Date(r.date.seconds * 1000).toISOString() : r.date,
                r.violation,
                r.status
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `utm-reports-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    const handleUpdateStatus = async (id, data) => {
        const success = await updateReport(id, data);
        if (success && selectedReport && selectedReport.id === id) {
            setSelectedReport({ ...selectedReport, ...data });
        }
    };

    return (
        <div className="main">
            <div className="page-title">Mobile Photo Reports - Transmitted Data</div>

            <div className="stats-row">
                <StatCard
                    icon="📷"
                    title="Photos Received"
                    value={stats.received}
                />
                <StatCard
                    icon="✓"
                    title="Verified"
                    value={stats.verified}
                />
                <StatCard
                    icon="⏳"
                    title="Awaiting Review"
                    value={stats.total - stats.verified - stats.processed}
                />
            </div>

            <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onExport={handleExport}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            <div className="main-layout">
                <ReportTable
                    reports={paginatedReports}
                    onSelectReport={handleReportSelect}
                    selectedReportId={selectedReport?.id}
                />

                <PhotoPreview
                    selectedReport={selectedReport}
                    onDownload={handleDownloadPhotos}
                />
            </div>

            {selectedReport && (
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button
                        className="btn btn-primary"
                        style={{ width: 'auto' }}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Update Status
                    </button>
                </div>
            )}

            <ReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                report={selectedReport}
                onUpdate={handleUpdateStatus}
            />
        </div>
    );
}
