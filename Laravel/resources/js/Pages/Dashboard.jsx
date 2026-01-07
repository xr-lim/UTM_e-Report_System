import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { useState, useEffect, useMemo } from 'react';
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
import { AlertTriangle, Bell, Car, Eye, MessageSquare, ChevronRight, User, X } from 'lucide-react';
import { GlassBadge } from '@/Components/Glass/GlassBadge';
import { GlassCard } from '@/Components/Glass/GlassCard';
import ReportHeatmap from '@/Components/ReportHeatmap';

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
  <div className="bg-white p-6 rounded-2xl border border-gray-200 flex items-center justify-between hover:border-gray-300 transition-colors">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
    </div>
    <div className={`p-4 rounded-2xl ${bg}`}>
      <Icon className={color} size={24} strokeWidth={2} />
    </div>
  </div>
);

const DistributionChart = ({ totalReports, trafficCount, suspiciousCount }) => {
  const trafficPercent = totalReports > 0 ? Math.round((trafficCount / totalReports) * 100) : 0;
  const suspiciousPercent = totalReports > 0 ? 100 - trafficPercent : 0;
  const total = totalReports || 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 h-full flex flex-col">
      <h3 className="font-bold text-gray-900 text-xl tracking-tight">Incident Type</h3>
      <p className="text-sm text-gray-500 mt-1 font-medium mb-8">Distribution of reported cases</p>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* CSS Conic Gradient Pie Chart */}
        <div className="relative w-48 h-48 rounded-full shadow-lg transition-transform hover:scale-105 duration-300"
            style={{ background: `conic-gradient(#1B56FD ${trafficPercent}%, #EF4444 ${trafficPercent}% 100%)` }}>
          <div className="absolute inset-8 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
            <span className="text-4xl font-extrabold text-gray-900">{totalReports}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-1">Total Reports</span>
          </div>
        </div>

        <div className="mt-8 w-full space-y-3">
          <div className="flex justify-between items-center p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#1B56FD] mr-3 shadow-sm"></div>
              <span className="text-gray-700 text-sm font-medium">Traffic ({trafficCount})</span>
            </div>
            <span className="font-bold text-[#1B56FD]">{trafficPercent}%</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-rose-50/50 rounded-xl border border-rose-100">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-3 shadow-sm"></div>
              <span className="text-gray-700 text-sm font-medium">Suspicious ({suspiciousCount})</span>
            </div>
            <span className="font-bold text-red-500">{suspiciousPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentTable = ({ reports }) => (
  <GlassCard className="overflow-hidden shadow-none border border-gray-200">
    <div className="px-8 py-6 border-b border-black/5 flex justify-between items-center bg-white">
      <div>
        <h3 className="font-bold text-gray-900 text-xl tracking-tight">Recent Reports</h3>
      </div>
      <button
        onClick={() => router.visit(route('reports.index'))}
        className="text-sm text-[#1B56FD] font-semibold hover:text-[#0118D8] px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
      >
        View All Reports →
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-black/5 text-[11px] uppercase tracking-widest font-semibold text-gray-400 bg-gray-50/50">
            <th className="px-8 py-4">Status</th>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Time</th>
            <th className="px-6 py-4">Reporter</th>
            <th className="px-6 py-4">Details</th>
            <th className="px-8 py-4 text-right"></th>
          </tr>
        </thead>
          <tbody className="divide-y divide-gray-50/50 bg-white">
            {reports.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-16 text-center text-gray-400">No recent reports found.</td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => router.visit(route('report.view', report.id))}
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
                      type={report.type.toLowerCase()}
                      label={report.type.toUpperCase()}
                      icon={report.type === 'Traffic' ? Car : Eye}
                      minWidth="min-w-[120px]"
                    />
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className="text-sm font-medium text-gray-700 font-mono">
                      {report.timeAgo}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                        <User size={12} />
                      </div>
                      <TruncatedID id={report.reporterName} />
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle max-w-xs">
                    <div>
                      <div className="font-medium text-sm text-gray-900 truncate" title={report.title}>
                        {report.title}
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
  </GlassCard>
);

// --- Helper Functions ---

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

const TruncatedID = ({ id }) => {
  if (!id) return <span className="text-gray-400">-</span>;
  const shortId = id.length > 8 ? `${id.substring(0, 4)}...${id.substring(id.length - 4)}` : id;
  return (
    <div className="group relative inline-block">
      <span className="font-mono text-[10px] text-gray-500 bg-gray-50/50 px-2 py-1 rounded border border-gray-100/50 group-hover:bg-blue-50/50 group-hover:text-blue-500 transition-colors cursor-help">
        {shortId}
      </span>
    </div>
  );
};

// --- Main Dashboard Component ---

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);
  const [heatmapFilter, setHeatmapFilter] = useState('all');
  const [showPins, setShowPins] = useState(true);
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({
    start: '', 
    end: getTodayStr()
  });
  
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

        const formattedDateTime = createdDate.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }) + ' ' + createdDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

          // Safely map and flatten Firestore objects
          return {
              id: doc.id,
              title:  fetchedDetails.fullDescription.substring(0, 50) || 'New Report', 
              type: data.type === 'traffic' ? 'Traffic' : 'Suspicious',
              status: data.status || 'Pending',
              reporterName: data.reporter.id || 'Anonymous',
              timeAgo: formattedDateTime,
              createdAt: createdDate,
              location: data.location || null,
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

  // --- Filter Logic for Heatmap ---
  const filteredHeatmapReports = useMemo(() => {
    return reports.filter(report => {
      // Filter by Type
      const matchType = heatmapFilter === 'all' || report.type.toLowerCase() === heatmapFilter;
      
      // Filter by Date
      let matchDate = true;
      const reportDate = report.createdAt instanceof Date ? report.createdAt : new Date(report.createdAt);

      if (dateRange.start) {
        const startLimit = new Date(dateRange.start);
        startLimit.setHours(0, 0, 0, 0); 
        if (reportDate < startLimit) matchDate = false;
      }
      
      if (dateRange.end) {
        const endLimit = new Date(dateRange.end);
        endLimit.setHours(23, 59, 59, 999); 
        if (reportDate > endLimit) matchDate = false;
      }
      
      return matchType && matchDate;
    });
  }, [reports, heatmapFilter, dateRange]);

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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="mb-4">
                  <h3 className="font-bold text-gray-800 text-lg">Report Heatmap</h3>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Toggle Pins Button */}
                  <button
                    onClick={() => setShowPins(!showPins)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      showPins 
                      ? 'bg-blue-50 text-blue-600 border-blue-200' 
                      : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                  >
                    Show Pins
                  </button>

                  {/* Date Range Selectors */}
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 gap-2">
                    <input
                      type="date" 
                      className="bg-transparent border-none text-xs font-semibold focus:ring-0 p-1"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                    />
                    <span className="text-gray-400 text-xs">to</span>
                    <input
                      type="date" 
                      className="bg-transparent border-none text-xs font-semibold focus:ring-0 p-1"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                    />
                    {(dateRange.start || dateRange.end) && (
                      <button 
                        onClick={() => setDateRange({start: '', end: ''})}
                        className="ml-1 p-1 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                        title="Clear Date Filter"
                      >
                        <X size={14}/>
                      </button>
                    )}
                </div>

                {/* Type Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  {['all', 'traffic', 'suspicious'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setHeatmapFilter(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        heatmapFilter === type 
                        ? 'bg-white shadow-sm text-blue-600 border border-gray-200' 
                        : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
              {/* Pass your reports state here */}
              <ReportHeatmap reports={filteredHeatmapReports} showPins={showPins} />
            </div>
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
        <div className="space-y-4">
          <RecentTable reports={reports.slice(0, 10)} />
          {reports.length > 10 && (
            <div className="flex justify-center pb-4">
              <button 
                onClick={() => router.visit(route('reports.index'))}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-[#1B56FD] font-bold text-sm rounded-xl shadow-sm hover:bg-gray-50 hover:shadow-md transition-all active:scale-95"
              >
                View All Reports →
              </button>
            </div>
          )}
        </div>
        

      </div>
    );
  };


  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      {/* Main Content Area */}
      <div className="py-12 min-h-screen bg-[#F4F6F9] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-[#F4F6F9] to-[#F4F6F9]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {renderContent()}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}