// Entry point for UTM Report System React App
// Renders the ReportApp component into the DOM

import React from 'react';
import { createRoot } from 'react-dom/client';
import ReportApp from './ReportApp';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('report-root');

    if (rootElement) {
        const root = createRoot(rootElement);
        root.render(
            <React.StrictMode>
                <ReportApp />
            </React.StrictMode>
        );
    }
});
