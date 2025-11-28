import React from 'react';

export default function SearchBar({
    searchTerm,
    onSearchChange,
    onExport,
    currentPage,
    totalPages,
    onPageChange
}) {
    return (
        <div className="search-section">
            <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Search plate number, location..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div style={{ fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📍 All Locations</span>
            </div>

            <button className="view-btn" onClick={onExport}>
                📊 Export Report
            </button>

            <div className="pagination">
                <button
                    className="page-btn"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    &lt;
                </button>
                <span style={{ fontSize: '12px', alignSelf: 'center' }}>
                    {currentPage} / {totalPages || 1}
                </span>
                <button
                    className="page-btn"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    &gt;
                </button>
            </div>
        </div>
    );
}
