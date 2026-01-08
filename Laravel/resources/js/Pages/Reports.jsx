import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    getFirestore,
    collection,
    query,
    onSnapshot,
    orderBy,
} from "firebase/firestore";
import { app } from "@/firebaseConfig";
import { Car, Eye, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, User } from 'lucide-react';
import { GlassCard } from '@/Components/Glass/GlassCard';
import { GlassBadge } from '@/Components/Glass/GlassBadge';
import { GlassButton } from '@/Components/Glass/GlassButton';
import { GlassInput } from '@/Components/Glass/GlassInput';

// --- Initialize Firebase Services ---
const db = getFirestore(app);

// --- Helper Components ---
const TruncatedID = ({ id }) => {
    if (!id) return <span className="text-gray-400">-</span>;
    const shortId = id.length > 8 ? `${id.substring(0, 4)}...${id.substring(id.length - 4)}` : id;

    return (
        <div className="group relative inline-block">
            <span className="font-mono text-[10px] text-gray-500 bg-gray-50/50 px-2 py-1 rounded border border-gray-100/50 group-hover:bg-blue-50/50 group-hover:text-blue-500 transition-colors cursor-help">
                {shortId}
            </span>
            <div className="absolute left-0 -top-8 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                {id}
            </div>
        </div>
    );
};

const SortableHeader = ({ label, sortKey, currentSort, onSort, className = "" }) => {
    const isActive = currentSort.key === sortKey;
    const direction = currentSort.direction;

    return (
        <th
            className={`px-6 py-4 cursor-pointer hover:bg-white/50 transition-colors select-none text-left ${className}`}
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center gap-1.5">
                <span>{label}</span>
                <span className="text-gray-400">
                    {isActive ? (
                        direction === 'asc' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                    ) : (
                        <ArrowUpDown size={12} className="opacity-30 hover:opacity-100 transition-opacity" />
                    )}
                </span>
            </div>
        </th>
    );
};

// --- Report Table Component ---
const ReportsTable = ({ reports, filterType, onFilterChange, searchQuery, onSearchChange, sortConfig, onSort, filterStatus, onStatusChange, dateRange, onDateRangeChange }) => {
    const [isFilterBarVisible, setIsFilterBarVisible] = useState(false);
    const getTodayStr = () => new Date().toISOString().split('T')[0];

    const clearFilters = () => {
        onFilterChange('all');
        onStatusChange('all');
        onDateRangeChange({ start: '', end: getTodayStr() });
        onSearchChange('');
    };

    return (
        <GlassCard className="overflow-hidden min-h-[600px] flex flex-col shadow-none">
            {/* Header / Controls Area */}
            <div className="px-8 py-6 border-b border-black/5 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <h3 className="font-bold text-gray-900 text-xl tracking-tight">All Reports ({reports.length})</h3>

                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <GlassInput
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search reports..."
                            className="w-full sm:w-72"
                        />
                        <GlassButton 
                            onClick={() => setIsFilterBarVisible(!isFilterBarVisible)}
                            className={`px-3 h-10 border ${isFilterBarVisible ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-500'}`}
                        >
                            <Filter size={18} />
                        </GlassButton>
                    </div>
                </div>

                {/* Advanced Filter Bar */}
                {isFilterBarVisible && (
                    <div className="flex flex-wrap items-end gap-4 bg-gray-50/80 p-4 rounded-xl border border-gray-100 animate-in slide-in-from-top-2 duration-200">
                        {/* Category Filter */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Type</span>
                            <select 
                                value={filterType}
                                onChange={(e) => onFilterChange(e.target.value)}
                                className="bg-white border-gray-200 rounded-lg text-xs font-medium focus:ring-blue-500 h-9 w-32"
                            >
                                <option value="all">All Types</option>
                                <option value="traffic">Traffic</option>
                                <option value="suspicious">Suspicious</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Status</span>
                            <select 
                                value={filterStatus}
                                onChange={(e) => onStatusChange(e.target.value)}
                                className="bg-white border-gray-200 rounded-lg text-xs font-medium focus:ring-blue-500 h-9 w-32"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="resolved">Resolved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        {/* Date Range */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Date Range</span>
                            <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 h-9 gap-2">
                                <input 
                                    type="date" 
                                    className="border-none text-[11px] p-0 focus:ring-0 w-28 font-medium"
                                    value={dateRange.start}
                                    onChange={(e) => onDateRangeChange({...dateRange, start: e.target.value})}
                                />
                                <span className="text-gray-300">-</span>
                                <input 
                                    type="date" 
                                    className="border-none text-[11px] p-0 focus:ring-0 w-28 font-medium"
                                    value={dateRange.end}
                                    onChange={(e) => onDateRangeChange({...dateRange, end: e.target.value})}
                                />
                            </div>
                        </div>

                        <button 
                            onClick={clearFilters}
                            className="h-9 px-4 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                        >
                            Reset
                        </button>
                    </div>
                )}
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                        <tr className="border-b border-black/5 text-[11px] uppercase tracking-widest font-semibold text-gray-400">
                            <th className="pl-8 pr-4 py-4 w-[120px]">Report ID</th>
                            <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={onSort} className="px-2 w-[110px]" />
                            <SortableHeader label="Type" sortKey="type" currentSort={sortConfig} onSort={onSort} className="px-2 w-[130px]" />
                            <SortableHeader label="Time" sortKey="createdAt" currentSort={sortConfig} onSort={onSort} className="px-4 w-[180px]" />
                            <SortableHeader label="Reporter" sortKey="reporterID" currentSort={sortConfig} onSort={onSort} className="px-4 w-[150px]" />
                            <SortableHeader label="Details" sortKey="description" currentSort={sortConfig} onSort={onSort} className="px-4 w-auto" />
                            <th className="px-8 py-4 text-right w-[60px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50">
                        {reports.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-24 text-center">
                                    <div className="flex flex-col items-center justify-center opacity-40">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <Filter size={24} className="text-gray-400" />
                                        </div>
                                        <p className="font-medium text-gray-900">No reports found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            reports.map((report) => (
                                <tr
                                    key={report.id}
                                    onClick={() => router.visit(route('report.view', { reportId: report.id, reportType: report.type }))}
                                    className="group hover:bg-blue-50/30 transition-colors duration-200 cursor-pointer border-b border-gray-100 last:border-0"
                                >
                                    <td className="pl-8 pr-4 py-5 align-middle truncate font-mono text-sm">
                                        {report.id}
                                    </td>   
                                    <td className="px-2 py-5 align-middle">
                                        <GlassBadge
                                            type={
                                                report.status.toLowerCase() === 'resolved' ? 'success' :
                                                report.status.toLowerCase() === 'pending' ? 'warning' : 'neutral'
                                            }
                                            label={report.status}
                                        />
                                    </td>
                                    <td className="px-2 py-5 align-middle">
                                        <GlassBadge
                                            type={report.type.toLowerCase()}
                                            label={report.type.toUpperCase()}
                                            icon={report.type === 'Traffic' ? Car : Eye}
                                            minWidth="min-w-[120px]"
                                        />
                                    </td>
                                    <td className="px-4 py-5 align-middle truncate text-sm">
                                        {report.createdAt.toLocaleString('en-US', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </td>
                                    <td className="px-4 py-5 align-middle">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                                                <User size={12} />
                                            </div>
                                            {report.reporterID && report.reporterID !== 'Anonymous' ? (
                                                <TruncatedID id={report.reporterID} />
                                            ) : (
                                                <span className="text-sm text-gray-500 italic">Anonymous</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 align-middle">
                                        <div className="max-w-[400px]">
                                            <div className="font-medium text-sm text-gray-900 truncate" description={report.description}>
                                                {report.description}
                                            </div>
                                            {report.type === 'Traffic' && report.plateNo && report.plateNo !== 'N/A' && (
                                                <div className="text-xs font-mono font-medium text-blue-600 mt-1 bg-blue-50/50 inline-block px-1.5 rounded">{report.plateNo}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 align-middle text-right">
                                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors ml-auto" />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Summary */}
            <div className="px-8 py-4 border-t border-black/5 flex justify-between items-center bg-gray-50/30 text-xs font-medium text-gray-400">
                <span>Showing {reports.length} results</span>
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
        </GlassCard>
    );
}


// --- Main Reports Component ---

export default function Reports() {
    const [reportsData, setReportsData] = useState({ Traffic: [], Suspicious: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

    const allReports = useMemo(() => {
        return [...reportsData.Traffic, ...reportsData.Suspicious].sort((a, b) => b.createdAt - a.createdAt);
    }, [reportsData]);

    useEffect(() => {
        setIsLoading(true);

        const processDocs = (snapshot, type) => {
            return snapshot.docs.map(doc => {
                const data = doc.data();
                const createdDate = data.created_at?.toDate ? data.created_at.toDate() : new Date();
                let displayDescription = 'No Description';
                if (typeof data.description === 'string') {
                    displayDescription = data.description;
                } else if (data.description?.id) {
                    displayDescription = "[Reference Data]";
                }
                return {
                    id: doc.id,
                    ...data,
                    type: type,
                    description: displayDescription.substring(0, 50) || 'No Description',
                    reporterID: data.reporter?.id || 'Anonymous',
                    plateNo: data.plate_number || 'N/A',
                    locationLabel: data.location_label || 'N/A',
                    timeAgo: createdDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
                             ' ' + createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    createdAt: createdDate,
                };
            });
        };

        const unsubTraffic = onSnapshot(
            query(collection(db, "traffic_reports"), orderBy("created_at", "desc")), 
            (snapshot) => {
                setReportsData(prev => ({
                    ...prev,
                    Traffic: processDocs(snapshot, 'Traffic')
                }));
                setIsLoading(false);
            }, 
            (err) => setError(err.message)
        );

        const unsubSuspicious = onSnapshot(
            query(collection(db, "suspicious_reports"), orderBy("created_at", "desc")), 
            (snapshot) => {
                setReportsData(prev => ({
                    ...prev,
                    Suspicious: processDocs(snapshot, 'Suspicious')
                }));
                setIsLoading(false);
            }, 
            (err) => setError(err.message)
        );

        return () => {
            unsubTraffic();
            unsubSuspicious();
        };
    }, []);

    // Handle sorting
    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // Filter and sort reports using useMemo for performance
    const processedReports = useMemo(() => {
        let result = allReports;

        // Filter by Report Type
        if (filterType !== 'all') {
            result = result.filter(r => r.type.toLowerCase() === filterType);
        }
        // Filter by Status
        if (filterStatus !== 'all') {
            result = result.filter(r => r.status.toLowerCase() === filterStatus);
        }
        // Filter by Date Range
        if (dateRange.start) {
            const startLimit = new Date(dateRange.start);
            startLimit.setHours(0, 0, 0, 0);
            result = result.filter(r => r.createdAt >= startLimit);
        }
        if (dateRange.end) {
            const endLimit = new Date(dateRange.end);
            endLimit.setHours(23, 59, 59, 999);
            result = result.filter(r => r.createdAt <= endLimit);
        }
        // Apply search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter((r) => {
                const searchableFields = [
                    r.id,
                    r.status,
                    r.type,
                    r.reporterID,
                    r.description,
                    r.plateNo,
                    r.locationLabel,
                ].filter(Boolean);

                return searchableFields.some((field) =>
                    field.toString().toLowerCase().includes(q)
                );
            });
        }

        // Apply sorting
        result.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle Date comparison for createdAt
            if (sortConfig.key === 'createdAt') {
                aValue = aValue instanceof Date ? aValue.getTime() : 0;
                bValue = bValue instanceof Date ? bValue.getTime() : 0;
            } else {
                // Convert to lowercase string for text comparison
                aValue = (aValue || '').toString().toLowerCase();
                bValue = (bValue || '').toString().toLowerCase();
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [allReports, searchQuery, sortConfig, filterType, filterStatus, dateRange]);

    return (
        <AuthenticatedLayout>
            <Head title="Reports" />

            {/* Main Content Area */}
            <div className="py-12 min-h-screen bg-[#F4F6F9] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-[#F4F6F9] to-[#F4F6F9]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-medium">Loading reports...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <div className="inline-block p-4 rounded-full bg-red-50 text-red-500 mb-4">
                                <Filter size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Unable to load reports</h3>
                            <p className="text-gray-500 mt-2 max-w-md mx-auto">{error}</p>
                        </div>
                    ) : (
                        <ReportsTable
                            reports={processedReports}
                            filterType={filterType}
                            onFilterChange={setFilterType}
                            filterStatus={filterStatus}
                            onStatusChange={setFilterStatus}
                            dateRange={dateRange}
                            onDateRangeChange={setDateRange}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                        />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}