import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ChatBox from '@/Components/ChatBox';
import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  DocumentReference,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { auth, app } from "@/firebaseConfig";
import { AlertTriangle, Bell, Car, Eye, MapPin, MessageSquare } from 'lucide-react';

// --- Initialize Firebase Services ---
const db = getFirestore(app);

// --- Constants & Theme Colors ---
// Theme: Deep Blue (#0118D8), Bright Blue (#1B56FD), White, Light Grey
const THEME = {
  primary: '#0118D8',
  accent: '#1B56FD',
  bg: '#F4F6F9',
};

// --- Sub-Components ---

const KPICard = ({ label, value, icon: Icon, color, bg }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
    </div>
    <div className={`p-4 rounded-full ${bg}`}>
      <Icon className={color} size={24} />
    </div>
  </div>
);

const HeatmapSection = () => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white z-10 relative">
      <div>
        <h3 className="font-bold text-gray-800 flex items-center text-lg">
          <MapPin size={20} className="mr-2 text-[#0118D8]" />
          Interactive Heatmap
        </h3>
        <p className="text-xs text-gray-500 ml-7">Visualizing report density across campus</p>
      </div>

      {/* Filter Toggles */}
      <div className="flex bg-gray-100 p-1 rounded-lg">
        <button className="flex items-center px-3 py-1.5 bg-white shadow-sm rounded-md text-xs font-medium text-blue-700">
          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
          Traffic
        </button>
        <button className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900">
          <span className="w-2 h-2 rounded-full bg-red-500 mr-2 opacity-30"></span>
          Suspicious
        </button>
      </div>
    </div>

    <div className="relative flex-1 bg-gray-50 min-h-[350px] overflow-hidden group">
      {/* Map Base - Grid Pattern */}
      <div className="absolute inset-0 bg-[#e5e9f2]"
        style={{ backgroundImage: 'linear-gradient(#d1d5db 1px, transparent 1px), linear-gradient(90deg, #d1d5db 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Campus Landmarks */}
      <div className="absolute top-10 left-20 px-3 py-1 bg-white/80 border border-gray-300 rounded text-[10px] font-bold text-gray-600 uppercase tracking-widest shadow-sm">Main Library</div>
      <div className="absolute bottom-20 right-32 px-3 py-1 bg-white/80 border border-gray-300 rounded text-[10px] font-bold text-gray-600 uppercase tracking-widest shadow-sm">Student Union</div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-white/80 border border-gray-300 rounded text-[10px] font-bold text-gray-600 uppercase tracking-widest shadow-sm">Eng. Faculty</div>

      {/* Heat Spots - Traffic (Blue) */}
      <div className="absolute top-[30%] left-[25%]">
        <div className="w-32 h-32 bg-blue-600/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-8 left-8 w-16 h-16 bg-blue-600/30 rounded-full blur-lg"></div>
        <MapPin size={24} className="absolute top-12 left-12 text-blue-700 drop-shadow-md" fill="#1B56FD" />
      </div>

      <div className="absolute top-[50%] right-[15%]">
        <div className="w-24 h-24 bg-blue-600/20 rounded-full blur-xl"></div>
        <MapPin size={24} className="absolute top-8 left-8 text-blue-700 drop-shadow-md" fill="#1B56FD" />
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-4 right-4 bg-white p-2 rounded shadow flex flex-col space-y-2">
        <button className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-600 font-bold">+</button>
        <button className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-600 font-bold">-</button>
      </div>
    </div>
  </div>
);

const DistributionChart = ({ totalReports, trafficCount, suspiciousCount }) => {
  const trafficPercent = totalReports ? Math.round((trafficCount / totalReports) * 100) : 0;
  const suspiciousPercent = totalReports ? 100 - trafficPercent : 0;
  const total = totalReports || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-full flex flex-col">
      <h3 className="font-bold text-gray-800 text-lg mb-2">Incident Type</h3>
      <p className="text-xs text-gray-500 mb-8">Distribution of reported cases</p>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* CSS Conic Gradient Pie Chart */}
        <div className="relative w-48 h-48 rounded-full shadow-lg transition-transform hover:scale-105 duration-300"
          style={{ background: `conic-gradient(#1B56FD 0% 60%, #EF4444 60% 100%)` }}>
          <div className="absolute inset-8 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
            <span className="text-4xl font-extrabold text-gray-900">105</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-1">Total Reports</span>
          </div>
        </div>

        <div className="mt-8 w-full space-y-4">
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#1B56FD] mr-3 shadow-sm"></div>
              <span className="text-gray-700 text-sm font-medium">Traffic Issues</span>
            </div>
            <span className="font-bold text-[#1B56FD]">60%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-3 shadow-sm"></div>
              <span className="text-gray-700 text-sm font-medium">Suspicious Activity</span>
            </div>
            <span className="font-bold text-red-500">40%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentTable = ({ reports }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
      <div>
        <h3 className="font-bold text-gray-800 text-lg">Recent Reports</h3>
      </div>
      <div className="flex space-x-2">
        <button onClick={() => router.visit(route('reports.index'))} className="text-sm text-[#1B56FD] font-medium hover:text-[#0118D8] px-3 py-1.5">View All Reports</button>
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
              <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No recent reports found.</td>
            </tr>
          ) : (
            reports.map((report) => (
              <tr
                key={report.id}
                className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                onClick={() => router.visit(route('report.view', { reportId: report.id }))}
              >
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${report.status.toLowerCase() === 'resolved' ? 'bg-green-100 text-green-700' :
                    report.status.toLowerCase() === 'pending' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                    {report.status.toLowerCase() === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5 animate-pulse"></div>}
                    {report.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center font-medium ${report.category === 'Traffic' ? 'text-blue-700' : 'text-red-700'
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
                  {report.category === 'Traffic' && report.plateNo && (
                    <div className="text-xs text-blue-600 font-bold mt-1">Plate No: {report.plateNo}</div>
                  )}
                  {report.category === 'Suspicious' && (
                    <div className="text-xs text-red-600 mt-1">{''}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering tr onClick
                      router.visit(route('report.view', { reportId: report.id }));
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-md text-xs font-medium hover:border-[#1B56FD] hover:text-[#1B56FD] transition-all shadow-sm group-hover:shadow-md"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Helper Functions ---

const getTimeAgo = (timestamp) => {
  if (!timestamp) return 'N/A';
  // Logic to calculate time difference
  // For simplicity, we'll return a placeholder string for now
  return "just now";
};

const fetchUserRole = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data().role : 'student';
  } catch (e) {
    console.error("Error fetching user role:", e);
    return 'student';
  }
};

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

// --- Main Dashboard Component ---

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribeReportsCleanup;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // If not logged in
        router.visit(route('login'));
        return;
      }

      if (!user.emailVerified) {
        // If not email verified
        alert("You are not verified yet! Please check your email.");

        // Kick them out
        signOut(auth).then(() => router.visit(route('verify-email')));
        return;
      }

      // --- Logged in and Verified: Start Authorization and Data Fetch ---
      setIsLoading(true);

      try {
        // Fetch User Role
        const role = await fetchUserRole(user.uid);
        setUserRole(role);

        const isAuthorized = role === 'admin' || role === 'authority';

        if (isAuthorized) {
          // Start real-time report fetching
          unsubscribeReportsCleanup = fetchReports();
        } else {
          // Unauthorized: Show message and stop loading
          setError(`Access Denied: Your role (${role}) is not authorized.`);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Dashboard init error:", err);
        setError("A critical error occurred while loading user data.");
        setIsLoading(false);
      }
    });

    // Cleanup listener when leaving page
    return () => {
      unsubscribeAuth();
      if (unsubscribeReportsCleanup) {
        unsubscribeReportsCleanup();
      }
    };
  }, []);

  // Function to Fetch Reports in Real-Time
  const fetchReports = () => {
    const reportsQuery = query(
      collection(db, "reports"),
      orderBy("created_at", "desc")
    );

    // Setup real-time listener (onSnapshot)
    const unsubscribe = onSnapshot(reportsQuery, async (snapshot) => {
      setIsLoading(true);
      let pendingCount = 0;
      let totalTraffic = 0;
      let totalSuspicious = 0;
      let todayIncidents = 0;

      // Use Promise.all to fetch the referenced description/plate_no data for ALL reports concurrently
      const reportsPromises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const now = Timestamp.now().toDate();
        const createdDate = data.created_at?.toDate ? data.created_at.toDate() : now;
        // Await the dynamic details fetch
        const fetchedDetails = await fetchReportDetails(data);

        // --- KPI Calculation ---
        if (data.status?.toLowerCase() === 'pending') { pendingCount++; }
        if (createdDate.toDateString() === Timestamp.now().toDate().toDateString()) { todayIncidents++; }
        if (data.type?.toLowerCase() === 'traffic') { totalTraffic++; }
        else if (data.type?.toLowerCase() === 'suspicious') { totalSuspicious++; }
        // --- End KPI Calculation ---

        const formattedDateTime = createdDate.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true, // Use AM/PM format
        });

        // Safely map and flatten Firestore objects
        return {
          id: doc.id,
          title: fetchedDetails.fullDescription.substring(0, 50) || 'New Report',
          category: data.type === 'traffic' ? 'Traffic' : 'Suspicious',
          status: data.status || 'Pending',
          reporterName: data.reporter.id || 'Anonymous',
          timeAgo: formattedDateTime,

          // --- Dynamic Fields Added to Final Object ---
          ...fetchedDetails,
        };
      });

      // Resolve all promises
      const reportsList = await Promise.all(reportsPromises);

      // Update KPI Data
      setKpiData([
        { label: 'Pending Reports', value: pendingCount, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: "Today's Incidents", value: todayIncidents, icon: Bell, color: 'text-[#1B56FD]', bg: 'bg-blue-50' },
        { label: 'Total Reports', value: reportsList.length, icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50' },
      ]);

      setReports(reportsList);
      setIsLoading(false);
      // Also store counts for the DistributionChart
      setDistributionData({ totalReports: reportsList.length, trafficCount: totalTraffic, suspiciousCount: totalSuspicious });

    }, (err) => {
      // Error path: Set error and stop loading
      console.error("Firestore real-time listener failed:", err);
      setError(`Failed to load reports: ${err.code}. Check Security Rules!`);
      setIsLoading(false);
    });

    return unsubscribe;
  };

  const [distributionData, setDistributionData] = useState({ totalReports: 0, trafficCount: 0, suspiciousCount: 0 });

  // --- Render Logic ---
  const isAuthorized = userRole === 'admin' || userRole === 'authority';

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-center py-20 text-blue-600 font-medium text-lg">Loading user role and fetching reports...</p>;
    }

    if (error || !isAuthorized) {
      return (
        <div className="text-center py-20">
          <h3 className="text-2xl font-bold text-red-700">Access Denied 🔒</h3>
          <p className="mt-2 text-gray-600">
            {error || `Your current role (${userRole}) is not authorized to view this dashboard.`}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8">

        {/* Row 1: KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>

        {/* Row 2: Heatmap & Distribution Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 min-h-[400px]">
            <HeatmapSection />
          </div>
          <div className="min-h-[400px]">
            <DistributionChart
              totalReports={distributionData.totalReports}
              trafficCount={distributionData.trafficCount}
              suspiciousCount={distributionData.suspiciousCount}
            />
          </div>
        </div>

        {/* Row 3: Recent Activity Table */}
        <RecentTable reports={reports} />

      </div>
    );
  };


  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      {/* Main Content Area */}
      <div className="py-8 min-h-screen bg-[#F4F6F9]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {renderContent()}
        </div>
      </div>

      {/* AI Incident Assistant ChatBox */}
      <ChatBox />
    </AuthenticatedLayout>
  );
}