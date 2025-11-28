import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from "@/firebaseConfig";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [activePage, setActivePage] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingReport, setEditingReport] = useState(null);

    // Check auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    name: firebaseUser.displayName || "Admin",
                    email: firebaseUser.email,
                });
            } else {
                router.visit('/login');
            }
        });
        return () => unsubscribe();
    }, []);

    // Fetch reports from Firebase
    useEffect(() => {
        const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reportsData = snapshot.docs.map((doc, index) => ({
                id: doc.id,
                no: index + 1,
                ...doc.data()
            }));
            setReports(reportsData);
            setFilteredReports(reportsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Filter reports based on search
    useEffect(() => {
        const filtered = reports.filter(report =>
            (report.reportId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (report.plate?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (report.location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (report.type?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
        setFilteredReports(filtered);
    }, [searchTerm, reports]);

    // Calculate stats
    const stats = {
        total: reports.length,
        received: reports.filter(r => r.status === 'Received' || r.status === 'pending').length,
        processed: reports.filter(r => r.status === 'Processed').length,
        verified: reports.filter(r => r.status === 'Verified' || r.status === 'resolved').length
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.visit('/login');
    };

    const handleSettings = () => {
        router.visit('/profile');
    };

    const selectReport = (report) => {
        setSelectedReport(report);
    };

    const openEditModal = (report) => {
        setEditingReport(report);
        setShowModal(true);
    };

    const updateReportStatus = async (newStatus) => {
        if (editingReport) {
            try {
                await updateDoc(doc(db, 'reports', editingReport.id), {
                    status: newStatus,
                    updatedAt: new Date().toISOString()
                });
                setShowModal(false);
                setEditingReport(null);
            } catch (error) {
                console.error('Error updating report:', error);
                alert('Failed to update report');
            }
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-MY', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'Received': { class: 'status-received', icon: '📥' },
            'pending': { class: 'status-received', icon: '📥' },
            'Processed': { class: 'status-processed', icon: '⏳' },
            'reviewed': { class: 'status-processed', icon: '⏳' },
            'Verified': { class: 'status-verified', icon: '✓' },
            'resolved': { class: 'status-verified', icon: '✓' }
        };
        return statusMap[status] || { class: 'status-received', icon: '📥' };
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <>
            <Head title="Dashboard" />
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto; background: #f5f7fa; color: #333; }
                
                .header {
                    background: #000;
                    color: white;
                    padding: 16px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: fixed;
                    top: 0;
                    width: 100%;
                    z-index: 100;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .header-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .header-brand img { height: 40px; }
                .header-user-container {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .header-user {
                    background: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #000;
                    font-size: 20px;
                    cursor: pointer;
                }
                .logout-btn {
                    background: #dc3545;
                    color: white;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                }
                .logout-btn:hover { background: #c82333; }

                .sidebar {
                    width: 240px;
                    background: white;
                    border-right: 1px solid #e0e0e0;
                    padding: 80px 0 20px;
                    position: fixed;
                    height: 100vh;
                    overflow-y: auto;
                }
                .sidebar-menu { list-style: none; }
                .sidebar-menu li { margin: 0; }
                .sidebar-menu a {
                    display: block;
                    padding: 12px 24px;
                    color: #666;
                    text-decoration: none;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-weight: 500;
                }
                .sidebar-menu a:hover { background: #f5f7fa; color: #333; }
                .sidebar-menu a.active {
                    background: #dfe8f5;
                    color: #0066cc;
                    border-left: 4px solid #0066cc;
                    padding-left: 20px;
                }

                .main {
                    margin-left: 240px;
                    margin-top: 64px;
                    flex: 1;
                    padding: 24px;
                    min-height: calc(100vh - 64px);
                }

                .page-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #0066cc;
                    margin-bottom: 24px;
                }

                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .stat-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .stat-icon {
                    font-size: 40px;
                    width: 60px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stat-content h3 {
                    font-size: 14px;
                    color: #666;
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .stat-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: #333;
                }

                .search-section {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 24px;
                    align-items: center;
                }
                .search-box {
                    flex: 1;
                    max-width: 400px;
                }
                .search-box input {
                    width: 100%;
                    padding: 10px 16px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 14px;
                }

                .content-grid {
                    display: grid;
                    grid-template-columns: 1fr 380px;
                    gap: 20px;
                }

                .table-container {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                table { width: 100%; border-collapse: collapse; }
                th {
                    background: #f9f9f9;
                    padding: 16px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 13px;
                    color: #333;
                    border-bottom: 1px solid #e0e0e0;
                }
                td {
                    padding: 14px 16px;
                    border-bottom: 1px solid #f0f0f0;
                    font-size: 13px;
                    color: #666;
                }
                tr:hover { background: #fafafa; cursor: pointer; }
                tr.selected { background: #f0f8ff; }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .status-received { background: #d1ecf1; color: #0c5460; }
                .status-processed { background: #fff3cd; color: #856404; }
                .status-verified { background: #d4edda; color: #155724; }

                .preview-panel {
                    background: white;
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    position: sticky;
                    top: 100px;
                    height: fit-content;
                }
                .preview-title {
                    font-weight: 700;
                    margin-bottom: 12px;
                    font-size: 14px;
                }
                .preview-image {
                    border-radius: 8px;
                    background: #f0f0f0;
                    min-height: 280px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #999;
                    font-size: 12px;
                    margin-bottom: 12px;
                    overflow: hidden;
                }
                .preview-image img {
                    width: 100%;
                    height: 280px;
                    object-fit: cover;
                }
                .preview-info {
                    font-size: 12px;
                    color: #666;
                }

                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .btn-primary { background: #0066cc; color: white; }
                .btn-primary:hover { background: #0052a3; }
                .btn-success { background: #28a745; color: white; }
                .btn-warning { background: #ffc107; color: #333; }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    border-radius: 12px;
                    padding: 32px;
                    max-width: 500px;
                    width: 90%;
                }
                .modal-title {
                    font-size: 20px;
                    font-weight: 700;
                    margin-bottom: 16px;
                }
                .modal-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    margin-top: 24px;
                }

                @media (max-width: 1024px) {
                    .content-grid { grid-template-columns: 1fr; }
                    .preview-panel { display: none; }
                }
                @media (max-width: 768px) {
                    .sidebar { width: 60px; }
                    .sidebar-menu a { padding: 12px; text-align: center; font-size: 0; }
                    .main { margin-left: 60px; }
                    .stats-row { grid-template-columns: 1fr; }
                }
            `}</style>

            {/* Header */}
            <div className="header">
                <div className="header-brand">
                    <img src="/logo.png" alt="UTM Report System" />
                </div>
                <div className="header-user-container">
                    <span style={{ color: '#999', fontSize: '14px' }}>{user?.name}</span>
                    <div className="header-user" onClick={handleSettings} title="Settings">👤</div>
                    <button className="logout-btn" onClick={handleLogout}>Log Out</button>
                </div>
            </div>

            {/* Sidebar */}
            <div className="sidebar">
                <ul className="sidebar-menu">
                    <li><a className={activePage === 'dashboard' ? 'active' : ''} onClick={() => setActivePage('dashboard')}>📊 Dashboard</a></li>
                    <li><a className={activePage === 'reviews' ? 'active' : ''} onClick={() => setActivePage('reviews')}>📝 Review Reports</a></li>
                    <li><a className={activePage === 'history' ? 'active' : ''} onClick={() => setActivePage('history')}>📁 Report History</a></li>
                    <li style={{ marginTop: '32px' }}><a className={activePage === 'statistics' ? 'active' : ''} onClick={() => setActivePage('statistics')}>📈 Statistics</a></li>
                    <li><a onClick={handleSettings}>⚙️ Settings</a></li>
                </ul>
            </div>

            {/* Main Content */}
            <div className="main">
                <div className="page-title">
                    {activePage === 'dashboard' && 'Mobile Photo Reports - Dashboard'}
                    {activePage === 'reviews' && 'Review Reports'}
                    {activePage === 'history' && 'Report History'}
                    {activePage === 'statistics' && 'Statistics'}
                </div>

                {/* Stats Row */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-icon">📥</div>
                        <div className="stat-content">
                            <h3>Reports Received</h3>
                            <div className="stat-value">{stats.total}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-content">
                            <h3>Pending Review</h3>
                            <div className="stat-value">{stats.received}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <h3>Verified</h3>
                            <div className="stat-value">{stats.verified}</div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="search-section">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search by ID, plate, location or type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <span style={{ color: '#666', fontSize: '14px' }}>
                        📍 {filteredReports.length} reports found
                    </span>
                </div>

                {/* Content Grid */}
                <div className="content-grid">
                    {/* Table */}
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>No.</th>
                                    <th>Report ID</th>
                                    <th>Type</th>
                                    <th>Location</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                            No reports found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReports.map((report, index) => {
                                        const statusInfo = getStatusBadge(report.status);
                                        return (
                                            <tr
                                                key={report.id}
                                                onClick={() => selectReport(report)}
                                                className={selectedReport?.id === report.id ? 'selected' : ''}
                                            >
                                                <td>{index + 1}</td>
                                                <td>{report.reportId || report.id.slice(0, 8)}</td>
                                                <td><strong>{report.type || 'N/A'}</strong></td>
                                                <td>{report.location || 'N/A'}</td>
                                                <td>{formatDate(report.createdAt)}</td>
                                                <td>
                                                    <span className={`status-badge ${statusInfo.class}`}>
                                                        {statusInfo.icon} {report.status || 'Received'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                                        onClick={(e) => { e.stopPropagation(); openEditModal(report); }}
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Preview Panel */}
                    <div className="preview-panel">
                        <div className="preview-title">Photo Preview</div>
                        <div className="preview-image">
                            {selectedReport?.image_path ? (
                                <img src={selectedReport.image_path} alt="Report" />
                            ) : (
                                'Click a row to view photo'
                            )}
                        </div>
                        {selectedReport && (
                            <div className="preview-info">
                                <div style={{ marginBottom: '8px' }}><strong>{selectedReport.type || 'Report'}</strong></div>
                                <div style={{ marginBottom: '4px', color: '#999' }}>📍 {selectedReport.location || 'N/A'}</div>
                                <div style={{ marginBottom: '4px', color: '#999' }}>📧 {selectedReport.user_email || 'N/A'}</div>
                                <div style={{ marginTop: '8px', padding: '8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '11px' }}>
                                    {selectedReport.description || 'No description provided'}
                                </div>
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: '12px' }}
                                    onClick={() => openEditModal(selectedReport)}
                                >
                                    Update Status
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showModal && editingReport && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-title">Update Report Status</div>
                        <div style={{ marginBottom: '16px' }}>
                            <strong>Report ID:</strong> {editingReport.reportId || editingReport.id.slice(0, 8)}
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <strong>Current Status:</strong> {editingReport.status || 'Received'}
                        </div>
                        <div className="modal-actions">
                            <button className="btn" style={{ background: '#f0f0f0' }} onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-warning" onClick={() => updateReportStatus('Processed')}>Mark Processed</button>
                            <button className="btn btn-success" onClick={() => updateReportStatus('Verified')}>Mark Verified</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
