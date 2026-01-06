import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    getFirestore,
    collection,
    query,
    onSnapshot,
    doc,
    getDoc,
    DocumentReference,
    orderBy,
    where
} from "firebase/firestore";
import { app } from "@/firebaseConfig";
import { Car, Eye, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, User } from 'lucide-react';
import { GlassCard } from '@/Components/Glass/GlassCard';
import { GlassBadge } from '@/Components/Glass/GlassBadge';
import { GlassButton } from '@/Components/Glass/GlassButton';
import { GlassInput } from '@/Components/Glass/GlassInput';

// --- Initialize Firebase Services ---
const db = getFirestore(app);

const fetchReportDetails = async (reportData) => {
    let details = {
        fullDescription: reportData.description || 'No description found.',
        plateNo: 'N/A',
        suspiciousDetails: 'N/A',
    };

    let descriptionRef = reportData.description;

    if (descriptionRef instanceof DocumentReference) {
        try {
            const descSnap = await getDoc(descriptionRef);

            if (descSnap.exists()) {
                const descData = descSnap.data();

                details.fullDescription = descData.description || 'No detailed description.';

                if (reportData.type?.toLowerCase() === 'traffic') {
                    details.plateNo = descData.plate_no || 'N/A';
                }
                else if (reportData.type?.toLowerCase() === 'suspicious') {
                    details.suspiciousDetails =
                        `Gender: ${descData.gender || 'N/A'}, ` +
                        `Cloth: ${descData.cloth_color || 'N/A'}, ` +
                        `Height: ${descData.height || 'N/A'}`;
                }
            }
        } catch (e) {
            console.error("Failed to fetch dynamic report details:", e);
            details.fullDescription = 'Error fetching details.';
        }
    }

    return details;
};

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
const ReportsTable = ({ reports, onView, filterType, onFilterChange, searchQuery, onSearchChange, sortConfig, onSort }) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    return (
        <GlassCard className="overflow-hidden min-h-[600px] flex flex-col shadow-none">
            {/* Header / Controls Area */}
            <div className="px-8 py-6 border-b border-black/5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
                <div>
                    <h3 className="font-bold text-gray-900 text-xl tracking-tight">All Reports</h3>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage and view all submitted incidents</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <GlassInput
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search reports..."
                        className="w-full sm:w-72"
                    />

                    <div className="relative">
                        <GlassButton
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`px-4 py-2.5 text-sm font-medium border border-gray-200/50 ${filterType !== 'all' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-600'}`}
                        >
                            <Filter size={16} className="mr-2" />
                            {filterType === 'all' ? 'Filter' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                        </GlassButton>

                        {isFilterOpen && (
                            <div className="absolute top-12 right-0 z-20 w-48 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl py-1 overflow-hidden">
                                {['all', 'traffic', 'suspicious'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => { onFilterChange(type); setIsFilterOpen(false); }}
                                        className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors ${filterType === type ? 'bg-blue-50/80 text-blue-600' : 'hover:bg-gray-50 text-gray-600'
                                            }`}
                                    >
                                        {type === 'all' ? 'All Reports' : `${type.charAt(0).toUpperCase() + type.slice(1)}`}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-black/5 text-[11px] uppercase tracking-widest font-semibold text-gray-400">
                            <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={onSort} className="pl-8" />
                            <SortableHeader label="Category" sortKey="category" currentSort={sortConfig} onSort={onSort} />
                            <SortableHeader label="Time" sortKey="createdAt" currentSort={sortConfig} onSort={onSort} />
                            <SortableHeader label="Reporter" sortKey="reporterName" currentSort={sortConfig} onSort={onSort} />
                            <SortableHeader label="Details" sortKey="title" currentSort={sortConfig} onSort={onSort} />
                            <th className="px-8 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50">
                        {reports.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-24 text-center">
                                    <div className="flex flex-col items-center justify-center opacity-40">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <Filter size={24} className="text-gray-400" />
                                        </div>
                                        <p className="font-medium text-gray-900">No reports found</p>
                                        <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            reports.map((report) => (
                                <tr
                                    key={report.id}
                                    onClick={() => onView(report.id)}
                                    className="group hover:bg-blue-50/30 transition-colors duration-200 cursor-pointer border-b border-gray-100 last:border-0"
                                >
                                    <td className="px-8 py-5 align-middle">
                                        <GlassBadge
                                            type={
                                                report.status.toLowerCase() === 'resolved' ? 'success' :
                                                    report.status.toLowerCase() === 'pending' ? 'warning' : 'neutral'
                                            }
                                            label={report.status}
                                        />
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <GlassBadge
                                            type={report.category.toLowerCase()}
                                            label={report.category.toUpperCase()}
                                            icon={report.category === 'Traffic' ? Car : Eye}
                                            minWidth="min-w-[120px]"
                                        />
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <span className="text-sm font-medium text-gray-700 font-mono">
                                            {report.createdAt.toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                                                <User size={12} />
                                            </div>
                                            {report.reporterName && report.reporterName !== 'Anonymous' ? (
                                                <TruncatedID id={report.reporterName} />
                                            ) : (
                                                <span className="text-sm text-gray-500 italic">Anonymous</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 align-middle max-w-xs">
                                        <div>
                                            <div className="font-medium text-sm text-gray-900 truncate" title={report.title}>
                                                {report.title}
                                            </div>
                                            {report.category === 'Traffic' && report.plateNo && report.plateNo !== 'N/A' && (
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
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

    // This hook fetches ALL reports and check filterType
    useEffect(() => {
        setIsLoading(true);
        setError(null);

        let reportsQuery = collection(db, "reports");

        if (filterType !== 'all') {
            // Filter by the 'type' field in Firestore.
            reportsQuery = query(reportsQuery, where("type", "==", filterType));
        }

        // Apply sorting
        reportsQuery = query(reportsQuery, orderBy("created_at", "desc"));

        const unsubscribe = onSnapshot(reportsQuery, async (snapshot) => {
            let reportsPromises = [];

            // Asynchronously fetch linked details for each report
            reportsPromises = snapshot.docs.map(async (docSnapshot) => {
                const data = docSnapshot.data();
                const createdDate = data.created_at?.toDate ? data.created_at.toDate() : new Date();

                const fetchedDetails = await fetchReportDetails(data);

                return {
                    id: docSnapshot.id,
                    title: fetchedDetails.fullDescription.substring(0, 50) || 'New Report',
                    category: data.type === 'traffic' ? 'Traffic' : 'Suspicious',
                    status: data.status || 'Pending',
                    reporterName: data.reporter?.id || 'Anonymous',
                    timeAgo: createdDate.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
                    createdAt: createdDate, // Store actual date for sorting
                    ...fetchedDetails,
                };
            });

            const reportsList = await Promise.all(reportsPromises);

            setReports(reportsList);
            setIsLoading(false);

        }, (err) => {
            console.error("Firestore Reports listener failed:", err);
            setError(`Failed to load reports: ${err.code}. Check permissions.`);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [filterType]);

    // Handle sorting
    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // Filter and sort reports using useMemo for performance
    const processedReports = useMemo(() => {
        let result = [...reports];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter((report) => {
                // Search across all relevant fields
                const searchableFields = [
                    report.status,
                    report.category,
                    report.timeAgo,
                    report.reporterName,
                    report.title,
                    report.id,
                    report.plateNo,
                    report.suspiciousDetails,
                    report.fullDescription,
                ].filter(Boolean); // Remove null/undefined

                return searchableFields.some((field) =>
                    field.toString().toLowerCase().includes(query)
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
    }, [reports, searchQuery, sortConfig]);

    const handleViewReport = (reportId) => {
        // Redirect to a dedicated view/edit route
        alert(`Navigating to view report: ${reportId}`);
        router.visit(route('report.view', reportId));
    };

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
                            onView={handleViewReport}
                            filterType={filterType}
                            onFilterChange={setFilterType}
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