import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    getFirestore,
    doc,
    getDoc,
    DocumentReference,
    updateDoc,
    Timestamp
} from "firebase/firestore";
import { app } from "@/firebaseConfig";
import { AlertTriangle, Car, Eye, MapPin, Loader, Save, ArrowLeft, X } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';

// --- Initialize Firebase Services ---
const db = getFirestore(app);

// --- Helper Functions ---
const fetchReportDetails = async (reportData) => {
    // This logic is critical for resolving Document References
    let details = {
        fullDescription: (typeof reportData.description === 'string' ? reportData.description : 'Pending details fetch...') || 'No description found.',
        plateNo: 'N/A',
        suspiciousDetails: 'N/A',
        imageURL: null,
        locationURL: null,
    };
    
    let descriptionRef = reportData.description;

    if (descriptionRef instanceof DocumentReference) {
        try {
            const descSnap = await getDoc(descriptionRef); 
            
            if (descSnap.exists()) {
                const descData = descSnap.data();

                details.fullDescription = descData.description || 'No detailed description.';
                details.imageURL = descData.image || null; 

                if (reportData.type?.toLowerCase() === 'traffic') {
                    details.plateNo = descData.plate_no || 'N/A';
                    
                } else if (reportData.type?.toLowerCase() === 'suspicious') {
                    details.suspiciousDetails = 
                        `Gender: ${descData.gender || 'N/A'}, Cloth: ${descData.cloth_color || 'N/A'}, Height: ${descData.height || 'N/A'}`;
                }
            }
        } catch (e) {
            console.error("Failed to fetch detailed report data from reference:", e);
            details.fullDescription = 'Error fetching details. (Check SDK/Permission)';
        }
    }
    
    // Convert GeoPoint to a map link if location data exists
    if (reportData.location && typeof reportData.location.latitude === 'number') {
        details.locationURL = `https://www.google.com/maps/search/?api=1&query=${reportData.location.latitude},${reportData.location.longitude}`;
    }

    return details;
};

// --- Main Component ---

export default function ReportDetail({ auth, reportId }) {
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentStatus, setCurrentStatus] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const statusOptions = ['pending', 'in review', 'resolved', 'rejected'];

    // --- Data Fetching Hook ---
    useEffect(() => {
        setIsLoading(true);
        setError(null);
        
        const fetchReport = async () => {
            try {
                // 1. Fetch the main report document
                const reportRef = doc(db, "reports", reportId);
                const reportSnap = await getDoc(reportRef);

                if (!reportSnap.exists()) {
                    setError("Report not found.");
                    setIsLoading(false);
                    return;
                }
                
                const data = reportSnap.data();
                
                // 2. Fetch linked details (full description, plate no, etc.)
                const fetchedDetails = await fetchReportDetails(data);
                
                // 3. Combine and format the final report object
                const combinedReport = {
                    id: reportSnap.id,
                    category: data.type === 'traffic' ? 'Traffic' : 'Suspicious',
                    status: data.status || 'pending',
                    reporterName: data.reporter?.id || 'Anonymous',
                    time: data.created_at?.toDate ? data.created_at.toDate().toLocaleString('en-US') : 'N/A',
                    
                    ...fetchedDetails,
                };

                setReport(combinedReport);
                setCurrentStatus(combinedReport.status);
                
            } catch (err) {
                console.error("Failed to fetch report details:", err);
                setError(`Failed to load report: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [reportId]);


    // --- Status Update Handler ---
    const handleSaveStatus = async () => {
        if (!report || currentStatus === report.status) return;

        setIsSaving(true);
        try {
            const reportRef = doc(db, "reports", reportId);
            await updateDoc(reportRef, {
                status: currentStatus,
                updated_at: Timestamp.now(), // Update timestamp
            });
            
            // Update local state and show success message
            setReport(prev => ({ ...prev, status: currentStatus }));
            alert(`Status successfully updated to: ${currentStatus.toUpperCase()}`);

        } catch (e) {
            console.error("Failed to update status:", e);
            alert("Failed to save status. Check server logs/permissions.");
        } finally {
            setIsSaving(false);
        }
    };
    
    // --- UI Helpers ---
    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === 'pending') return 'text-orange-700 bg-orange-100 border-orange-200';
        if (s === 'in review') return 'text-blue-700 bg-blue-100 border-blue-200';
        if (s === 'resolved') return 'text-green-700 bg-green-100 border-green-200';
        if (s === 'rejected') return 'text-red-700 bg-red-100 border-red-200';
        return 'text-gray-600 bg-gray-100 border-gray-200';
    };


    // --- Render Logic ---
    if (isLoading) {
        return (
            <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Loading...</h2>}>
                <div className="text-center py-20 text-blue-600 font-medium text-lg flex items-center justify-center gap-3">
                    <Loader size={20} className="animate-spin" /> Fetching Report Details...
                </div>
            </AuthenticatedLayout>
        );
    }

    if (error) {
        return (
            <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Error</h2>}>
                 <div className="text-center py-20 text-red-600 font-bold">{error}</div>
            </AuthenticatedLayout>
        );
    }
    
    // Ensure report is available before rendering details
    if (!report) {
         return null; 
    }

    const isTraffic = report.category === 'Traffic';
    const isStatusChanged = currentStatus !== report.status;


    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Report Detail: {report.id}
                    </h2>
                    <PrimaryButton 
                        onClick={() => router.visit(route('reports.index'))}
                        className="bg-gray-500 hover:bg-gray-600 px-4 py-2"
                    >
                        <ArrowLeft size={16} className="mr-2" /> Back to List
                    </PrimaryButton>
                </div>
            }
        >
            <Head title={`Report ${report.id}`} />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* --- COLUMN 1 & 2: Details and Image --- */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* Report Status Management */}
                            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                    <AlertTriangle size={20} className="text-red-500 mr-2" />
                                    Report Status & Action
                                </h3>
                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-medium text-gray-700">Update Status:</label>
                                    <select
                                        value={currentStatus}
                                        onChange={(e) => setCurrentStatus(e.target.value)}
                                        className={`px-5 py-2 border rounded-md text-sm font-semibold capitalize ${getStatusColor(currentStatus)}`}
                                        disabled={isSaving}
                                    >
                                        {statusOptions.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <PrimaryButton 
                                        onClick={handleSaveStatus}
                                        disabled={isSaving || !isStatusChanged}
                                        className={`transition-colors ${isStatusChanged ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}`}
                                    >
                                        <Save size={16} className="mr-2" />
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </PrimaryButton>
                                    {isStatusChanged && (
                                        <button 
                                            onClick={() => setCurrentStatus(report.status)} 
                                            className="text-gray-500 hover:text-red-600 flex items-center text-sm"
                                        >
                                            <X size={16} className="mr-1" /> Revert
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Main Description and Core Details */}
                            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">
                                    {isTraffic ? 'Traffic Violation Details' : 'Suspicious Activity Report'}
                                </h3>
                                
                                {/* Image Display */}
                                {report.imageURL && (
                                    <div className="mb-6">
                                        <img 
                                            src={report.imageURL} 
                                            alt="Report Evidence" 
                                            className="w-full max-h-96 object-cover rounded-lg shadow-inner border border-gray-200"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Evidence Photo</p>
                                    </div>
                                )}

                                {/* Full Description */}
                                <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
                                    <p className="font-semibold text-gray-700 mb-2">Description:</p>
                                    <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{report.fullDescription}</p>
                                </div>

                                {/* Traffic Specific Detail */}
                                {isTraffic && (
                                    <div className="mt-4">
                                        <span className="inline-flex items-center text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-100">
                                            <Car size={20} className="mr-2" />
                                            Plate Number: {report.plateNo}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Suspicious Specific Details */}
                                {!isTraffic && report.suspiciousDetails !== 'N/A' && (
                                    <div className="mt-4">
                                        <span className="inline-flex items-center text-lg font-bold text-red-600 bg-red-50 px-3 py-1 rounded-md border border-red-100">
                                            <Eye size={20} className="mr-2" />
                                            Suspect Info: {report.suspiciousDetails}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* --- COLUMN 3: Metadata and Reporter --- */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Metadata</h3>
                                <div className="space-y-3 text-sm">
                                    <p className="flex justify-between items-center border-b pb-2">
                                        <span className="font-medium text-gray-600">ID:</span>
                                        <span className="font-mono text-gray-900">{report.id}</span>
                                    </p>
                                    <p className="flex justify-between items-center border-b pb-2">
                                        <span className="font-medium text-gray-600">Reporter ID:</span>
                                        <span className="font-mono text-gray-900">{report.reporterName}</span>
                                    </p>
                                    <p className="flex justify-between items-center border-b pb-2">
                                        <span className="font-medium text-gray-600">Time Submitted:</span>
                                        <span className="text-gray-900">{report.time}</span>
                                    </p>
                                    <p className="flex justify-between items-center border-b pb-2">
                                        <span className="font-medium text-gray-600">Current Status:</span>
                                        <span className={`font-bold capitalize ${getStatusColor(report.status)}`}>
                                            {report.status}
                                        </span>
                                    </p>
                                    {report.locationURL && (
                                        <p className="pt-2">
                                            <a 
                                                href={report.locationURL} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="w-full inline-flex justify-center items-center text-blue-600 hover:underline transition-colors"
                                            >
                                                <MapPin size={16} className="mr-1" />
                                                View Location on Map
                                            </a>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}