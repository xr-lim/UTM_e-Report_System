import React from 'react';

export default function StatCard({ icon, title, value }) {
    return (
        <div className="stat-card">
            <div className="stat-icon">
                {icon}
            </div>
            <div className="stat-content">
                <h3>{title}</h3>
                <div className="stat-value">{value}</div>
            </div>
        </div>
    );
}
