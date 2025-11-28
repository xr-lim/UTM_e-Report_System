import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
    return (
        <div className="sidebar">
            <ul className="sidebar-menu">
                <li>
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        Dashboard
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/reviews"
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        Review Reports
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/history"
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        Report History
                    </NavLink>
                </li>
                <li style={{ marginTop: '32px' }}>
                    <NavLink
                        to="/statistics"
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        Statistics
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/settings"
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        Settings
                    </NavLink>
                </li>
            </ul>
        </div>
    );
}
