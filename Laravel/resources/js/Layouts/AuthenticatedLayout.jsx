import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from '@/firebaseConfig';
import {
    LogOut,
    Bell,
    Search,
    Menu,
    X
} from 'lucide-react';

// --- Helper Component for the Blue Header Links ---
const NavbarItem = ({ href, active, children }) => (
    <Link
        href={href}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${active
                ? 'bg-[#1B56FD] text-white shadow-md'
                : 'text-blue-100 hover:bg-white/10 hover:text-white'
            }`}
    >
        {children}
    </Link>
);

export default function AuthenticatedLayout({ header, children }) {
    const [user, setUser] = useState(null);
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    const auth = getAuth(app);

    // ✅ Get Firebase User
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    name: firebaseUser.displayName || "User",
                    email: firebaseUser.email,
                });
            } else {
                // Not logged in → redirect to login page
                window.location.href = "/login";
            }
        });

        return () => unsubscribe();
    }, []);

    // ✅ Firebase logout
    const handleLogout = async () => {
        await signOut(auth);
        window.location.href = "/login";
    };

    // Helper to get initials
    const getInitials = (name) => {
        return name
            ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
            : 'U';
    };


    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F6F9]">
            {/* --- Top Navbar (Deep Blue) --- */}
            <header className="bg-[#0118D8] text-white shadow-lg sticky top-0 z-[1001]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Left Section: Logo & Desktop Nav */}
                        <div className="flex items-center">
                            {/* Logo */}
                            <div className="flex-shrink-0 flex items-center gap-3">
                                <Link href="/dashboard" className="flex items-center gap-3">
                                    <div className="bg-white p-1 rounded-lg">
                                        <ApplicationLogo className="block h-8 w-auto fill-current text-[#0118D8]" />
                                    </div>
                                    <div>
                                        <h1 className="font-bold text-lg tracking-tight leading-none">UTM ADMIN</h1>
                                        <p className="text-blue-200 text-[10px] uppercase tracking-wider leading-none">Report System</p>
                                    </div>
                                </Link>
                            </div>

                            {/* Desktop Navigation Links */}
                            <div className="hidden md:ml-10 md:flex md:space-x-2">
                                <NavbarItem href={route('dashboard')} active={route().current('dashboard')}>
                                    Dashboard
                                </NavbarItem>
                                {/* Add your other links here */}
                                <NavbarItem href={route('reports.index')} active={route().current('reports.index')}>
                                    Reports
                                </NavbarItem>
                            </div>
                        </div>

                        {/* Right Section: Actions & Profile */}
                        <div className="hidden md:flex items-center space-x-4">
                            

                            {/* Notification Bell */}
                            <button className="relative p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                <Bell size={20} />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#0118D8]"></span>
                            </button>

                            {/* User Profile & Logout */}
                            <div className="flex items-center gap-3 pl-4 border-l border-blue-800">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <p className="text-xs text-blue-300 mt-1">{user.email}</p>
                                </div>
                                <div className="h-9 w-9 bg-[#1B56FD] rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-[#0012A3]">
                                    {getInitials(user.name)}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="ml-2 text-blue-300 hover:text-red-400 transition-colors"
                                    title="Log Out"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Hamburger Button */}
                        <div className="-me-2 flex items-center md:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((prev) => !prev)}
                                className="inline-flex items-center justify-center rounded-md p-2 text-blue-200 hover:bg-white/10 hover:text-white focus:outline-none"
                            >
                                {showingNavigationDropdown ? (
                                    <X className="h-6 w-6" strokeWidth={2} />
                                ) : (
                                    <Menu className="h-6 w-6" strokeWidth={2} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {showingNavigationDropdown && (
                    <div className="md:hidden bg-[#0012A3] border-t border-blue-800">
                        <div className="space-y-1 px-2 pb-3 pt-2">
                            <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                                Dashboard
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href="#" active={false}>
                                Reports
                            </ResponsiveNavLink>
                        </div>

                        <div className="border-t border-blue-800 pb-4 pt-4">
                            <div className="flex items-center px-4">
                                <div className="h-10 w-10 bg-[#1B56FD] rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-[#0012A3]">
                                    {getInitials(user.name)}
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-white">{user.name}</div>
                                    <div className="text-sm font-medium text-blue-300">{user.email}</div>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <ResponsiveNavLink as="button" onClick={handleLogout} className="text-red-200 hover:text-red-100 hover:bg-red-900/20">
                                    Log Out
                                </ResponsiveNavLink>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {header && (
                <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}