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
import { AlertTriangle, Car, Eye, MapPin, Loader, Save, ArrowLeft, X, Maximize2 } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';

// --- Initialize Firebase Services ---
const db = getFirestore(app);

// --- Helper Functions ---
const fetchReportDetails = async (reportData) => {
    let details = {
        fullDescription: (typeof reportData.description === 'string' ? reportData.description : 'Pending details fetch...') || 'No description found.',
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
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        
        const fetchReport = async () => {
            try {
                // Fetch the main report document
                const reportRef = doc(db, "reports", reportId);
                const reportSnap = await getDoc(reportRef);

                if (!reportSnap.exists()) {
                    setError("Report not found.");
                    setIsLoading(false);
                    return;
                }
                
                const data = reportSnap.data();
                const fetchedDetails = await fetchReportDetails(data);
                const isTraffic = data.type?.toLowerCase() === 'traffic';

                let primary_image = null;
                if (isTraffic) {
                    primary_image = data.image_with_cp;
                } else {
                    primary_image = data.suspect_face_enlarged || data.image_with_face || null;
                }

                // Combine and format the final report object
                const combinedReport = {
                    id: reportSnap.id,
                    type: data.type === 'traffic' ? 'Traffic' : 'Suspicious',
                    category: data.category,
                    status: data.status || 'pending',
                    reporterId: data.reporter?.id || 'Anonymous',
                    time: data.created_at?.toDate ? data.created_at.toDate().toLocaleString('en-US') : 'N/A',
                    primary_image: primary_image,
                    supporting_image: data.supporting_image || [],
                    location: data.location || null,
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
                updated_at: Timestamp.now(),
            });
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

    const isTraffic = report.type === 'Traffic';
    const isStatusChanged = currentStatus !== report.status;

    // OpenStreetMap Export URL for Iframe
    const osmUrl = report.location 
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${report.location.longitude-0.005},${report.location.latitude-0.005},${report.location.longitude+0.005},${report.location.latitude+0.005}&layer=mapnik&marker=${report.location.latitude},${report.location.longitude}`
        : null;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Report: {report.id}
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

            {/* --- FLOATING WINDOW (MODAL) --- */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 transition-all"
                    onClick={() => setSelectedImage(null)}
                >
                    <button className="absolute top-5 right-5 text-white hover:text-gray-300 transition">
                        <X size={40} />
                    </button>
                    <img 
                        src={selectedImage} 
                        className="max-w-full max-h-full rounded shadow-2xl animate-in zoom-in-95 duration-200" 
                        alt="Enlarged view" 
                    />
                </div>
            )}

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* --- COLUMN 1 & 2: Details and Image --- */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* --- PRIMARY IMAGE SECTION --- */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Primary Evidence</h3>
                                {report.primary_image ? (
                                    <div className="p-4 flex justify-center bg-gray-100 cursor-pointer group relative"
                                        onClick={() => setSelectedImage(report.primary_image)}
                                    >
                                        <img 
                                            src={report.primary_image} 
                                            alt="Primary evidence" 
                                            className="max-h-[500px] rounded shadow-lg transition group-hover:opacity-90"
                                            onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Image+Not+Found'; }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                            <div className="bg-black/50 p-3 rounded-full text-white">
                                                <Maximize2 size={24} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 italic">
                                        No primary image provided.
                                    </div>
                                )}
                            </div>
                            
                            {/* --- SUPPORTING IMAGES GRID --- */}
                            {report.supporting_image && report.supporting_image.length > 0 && (
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                                        Supporting Images ({report.supporting_image.length})
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {report.supporting_image.map((url, index) => (
                                            <div key={index} className="aspect-video rounded-lg overflow-hidden border border-gray-100 group relative cursor-pointer"
                                                onClick={() => setSelectedImage(url)}>
                                                <img 
                                                    src={url} 
                                                    alt={`Support ${index + 1}`} 
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                />
                                                {/* Optional: Overlay on hover */}
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">View Large</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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

                                {/* Full Description */}
                                <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
                                    <p className="font-semibold text-gray-700 mb-2">Category: {report.category}</p>
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
                                        <span className="font-mono text-gray-900">{report.reporterId}</span>
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
                                    <p className="pt-2">
                                        {/* OpenStreetMap Iframe */}
                                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                            <div className="p-4 border-b bg-gray-50 font-bold text-sm text-gray-500 uppercase flex items-center gap-2">
                                                <MapPin size={16} className="text-red-500"/> Incident Location
                                            </div>
                                            <div className="h-64 w-full">
                                                {osmUrl ? (
                                                    <iframe 
                                                        width="100%" 
                                                        height="100%" 
                                                        frameBorder="0" 
                                                        scrolling="no" 
                                                        marginHeight="0" 
                                                        marginWidth="0" 
                                                        src={osmUrl}
                                                        style={{ border: 0 }}
                                                    ></iframe>
                                                ) : (
                                                    <div className="h-full flex items-center justify-center text-gray-400">No Location Data</div>
                                                )}
                                            </div>
                                        </div>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}