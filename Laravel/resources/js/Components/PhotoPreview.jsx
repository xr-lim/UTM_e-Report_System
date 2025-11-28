import React from 'react';

export default function PhotoPreview({ selectedReport, onDownload }) {
    if (!selectedReport) {
        return (
            <div className="photo-preview-panel">
                <div className="photo-preview-title">Photo Preview</div>
                <div className="photo-preview-container">
                    Select a report to view photo
                </div>
            </div>
        );
    }

    const photoUrl = selectedReport.photos && selectedReport.photos.length > 0
        ? selectedReport.photos[0]
        : null;

    return (
        <div className="photo-preview-panel">
            <div className="photo-preview-title">Photo Preview</div>

            <div className="photo-preview-container">
                {photoUrl ? (
                    <img src={photoUrl} alt="Report Evidence" />
                ) : (
                    <span>No photo available</span>
                )}
            </div>

            <div className="photo-info">
                <div style={{ marginBottom: '8px' }}>
                    <strong>{selectedReport.plate}</strong>
                </div>
                <div style={{ marginBottom: '4px', color: '#999', fontSize: '11px' }}>
                    {selectedReport.location}
                </div>
                <div style={{ marginBottom: '4px', color: '#999', fontSize: '11px' }}>
                    {selectedReport.date && (selectedReport.date.seconds
                        ? new Date(selectedReport.date.seconds * 1000).toLocaleString()
                        : new Date(selectedReport.date).toLocaleString())}
                </div>

                <div className="info-box">
                    <strong>{selectedReport.violation}</strong>
                    <br />
                    {selectedReport.notes && (
                        <span style={{ fontStyle: 'italic', marginTop: '4px', display: 'block' }}>
                            Note: {selectedReport.notes}
                        </span>
                    )}
                </div>

                {photoUrl && (
                    <button
                        className="btn btn-primary"
                        onClick={() => onDownload(photoUrl, selectedReport.reportId || selectedReport.id)}
                    >
                        Download Photo
                    </button>
                )}
            </div>
        </div>
    );
}
