import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { useState, useEffect, useRef } from 'react';
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
import { Car, Eye, Filter, View } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';

// --- Initialize Firebase Services ---
const db = getFirestore(app);

// --- Helper Functions (Assuming you place these outside the component, or import them) ---
// You will need to bring over fetchUserRole and fetchReportDetails from your Dashboard.jsx setup

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
                
                // Check the report type to map the correct fields
                if (reportData.type?.toLowerCase() === 'traffic') {
                    details.plateNo = descData.plate_no || 'N/A';
                } 
                else if (reportData.type?.toLowerCase() === 'suspicious') {
                    // Key details of suspicious document
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

// --- Report Table Component (Optimized for Reports Page) ---
const ReportsTable = ({ reports, onView, filterType, onFilterChange }) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef(null);
    
    useEffect(() => {
        function handleClickOutside(event) {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [filterRef]);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-800 text-lg">All Reports ({reports.length})</h3>
                <div className="flex space-x-2 relative" ref={filterRef}>
                    <button onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center px-3 py-1.5 bg-white border border-gray-200 shadow-sm rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                        <Filter size={14} className="mr-2"/>
                        Filter
                    </button>

                    {isFilterOpen && (
                        <div className="absolute top-10 right-0 z-10 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                            {['all', 'traffic', 'suspicious'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => { onFilterChange(type); setIsFilterOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm capitalize ${
                                        filterType === type ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {type} Reports
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4">Reporter</th>
                            <th className="px-6 py-4">Details</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {reports.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No reports found.</td>
                            </tr>
                        ) : (
                            reports.map((report) => (
                                <tr key={report.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                            report.status.toLowerCase() === 'resolved' ? 'bg-green-100 text-green-700' :
                                            report.status.toLowerCase() === 'pending' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {report.status.toLowerCase() === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5 animate-pulse"></div>}
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center font-medium ${
                                            report.category === 'Traffic' ? 'text-blue-700' : 'text-red-700'
                                        }`}>
                                            {report.category === 'Traffic' ? <Car size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
                                            {report.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{report.timeAgo}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{report.reporterName || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{report.title}</div>
                                        <div className="text-xs text-gray-400">ID: {report.id}</div>
                                        {report.category === 'Traffic' && report.plateNo && report.plateNo !== 'N/A' && (
                                            <div className="text-xs text-blue-600 font-bold mt-1">Plate No: {report.plateNo}</div>
                                        )}
                                        {report.category === 'Suspicious' && report.suspiciousDetails && report.suspiciousDetails !== 'N/A' && (
                                            <div className="text-xs text-red-600 mt-1">Details: {report.suspiciousDetails}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <PrimaryButton onClick={() => onView(report.id)} className="px-3 py-1.5 justify-center">
                                            View
                                            <View size={18} className="ml-2" />
                                        </PrimaryButton>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


// --- Main Reports Component ---

export default function Reports({ auth }) {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterType, setFilterType] = useState('all');

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
            reportsPromises = snapshot.docs.map(async (doc) => {
                const data = doc.data();
                const createdDate = data.created_at?.toDate ? data.created_at.toDate() : new Date();
                
                const fetchedDetails = await fetchReportDetails(data); 

                return {
                    id: doc.id,
                    title: fetchedDetails.fullDescription.substring(0, 50) || 'New Report',
                    category: data.type === 'traffic' ? 'Traffic' : 'Suspicious',
                    status: data.status || 'Pending',
                    reporterName: data.reporter?.id || 'Anonymous', 
                    timeAgo: createdDate.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
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

    const handleViewReport = (reportId) => {
        // Redirect to a dedicated view/edit route
        router.visit(route('report.view', reportId)); 
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Reports List</h2>}
        >
            <Head title="Reports" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {isLoading ? (
                        <div className="text-center py-20 text-blue-600 font-medium text-lg">Loading all reports...</div>
                    ) : error ? (
                         <div className="text-center py-20 text-red-600 font-bold">{error}</div>
                    ) : (
                        <ReportsTable 
                            reports={reports} 
                            onView={handleViewReport} 
                            filterType={filterType}
                            onFilterChange={setFilterType}
                        />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}