// Main App component for UTM Report System
// Sets up routing and layout structure with Header and Sidebar

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ReportDashboard from './pages/ReportDashboard';
import ReportHistory from './pages/ReportHistory';
import ReviewReports from './pages/ReviewReports';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';

// Import dashboard styles
import '../css/dashboard.css';

export default function App() {
    return (
        <Router basename="/reports">
            <div className="container">
                {/* Fixed Header */}
                <Header />

                {/* Fixed Sidebar Navigation */}
                <Sidebar />

                {/* Main Content Area with Routes */}
                <Routes>
                    {/* Redirect root to dashboard */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    {/* Dashboard route */}
                    <Route path="/dashboard" element={<ReportDashboard />} />

                    {/* Review Reports route */}
                    <Route path="/reviews" element={<ReviewReports />} />

                    {/* Report History route */}
                    <Route path="/history" element={<ReportHistory />} />

                    {/* Statistics route */}
                    <Route path="/statistics" element={<Statistics />} />

                    {/* Settings route */}
                    <Route path="/settings" element={<Settings />} />

                    {/* Fallback route - redirect to dashboard */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </div>
        </Router>
    );
}
