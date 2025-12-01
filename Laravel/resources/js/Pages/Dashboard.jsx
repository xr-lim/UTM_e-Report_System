import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useEffect } from 'react';
import { 
  AlertTriangle, 
  Bell, 
  Car,
  Eye,
  MapPin,
  MessageSquare, 
  Filter
} from 'lucide-react';

// --- Constants & Theme Colors ---
// Theme: Deep Blue (#0118D8), Bright Blue (#1B56FD), White, Light Grey
const THEME = {
  primary: '#0118D8',
  accent: '#1B56FD',
  bg: '#F4F6F9',
};

// --- Mock Data ---
const MOCK_REPORTS = [
  { id: 'R-1024', title: 'Illegal Parking at Block A', category: 'Traffic', reporter: 'Ivan Tan', time: '5m ago', status: 'Pending' },
  { id: 'R-1023', title: 'Suspicious Individual', category: 'Suspicious', reporter: 'Guard John', time: '1h ago', status: 'Resolved' },
  { id: 'R-1022', title: 'Accident near Gate 2', category: 'Traffic', reporter: 'Dr. Emily', time: '2h ago', status: 'Resolved' },
  { id: 'R-1021', title: 'Unattended Bag', category: 'Suspicious', reporter: 'Anon', time: '3h ago', status: 'Resolved' },
  { id: 'R-1020', title: 'Double Parking', category: 'Traffic', reporter: 'Admin', time: '4h ago', status: 'Resolved' },
];

const KPI_DATA = [
  { label: 'Pending Reports', value: '12', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
  { label: "Today's Incidents", value: '5', icon: Bell, color: 'text-[#1B56FD]', bg: 'bg-blue-50' },
  { label: 'Open Feedback', value: '3', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50' },
];

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

const DistributionChart = () => (
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

const RecentTable = () => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
      <div>
        <h3 className="font-bold text-gray-800 text-lg">Recent Activity</h3>
        <p className="text-xs text-gray-500 mt-1">Real-time feed of incoming reports</p>
      </div>
      <div className="flex space-x-2">
         <button className="flex items-center px-3 py-1.5 bg-white border border-gray-200 shadow-sm rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50">
          <Filter size={14} className="mr-2" />
          Filter
        </button>
        <button className="text-sm text-[#1B56FD] font-medium hover:text-[#0118D8] px-3 py-1.5">View All Reports</button>
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
          {MOCK_REPORTS.map((report) => (
            <tr key={report.id} className="hover:bg-blue-50/50 transition-colors group cursor-pointer">
              <td className="px-6 py-4">
                 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                  report.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                  report.status === 'Pending' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {report.status === 'Pending' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5 animate-pulse"></div>}
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
              <td className="px-6 py-4 text-gray-500 font-mono text-xs">{report.time}</td>
              <td className="px-6 py-4 font-medium text-gray-900">{report.reporter}</td>
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{report.title}</div>
                <div className="text-xs text-gray-400">ID: {report.id}</div>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-md text-xs font-medium hover:border-[#1B56FD] hover:text-[#1B56FD] transition-all shadow-sm group-hover:shadow-md">
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Main Dashboard Component ---

export default function Dashboard() {
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is logged in, check verification
                if (!user.emailVerified) {
                    alert("You are not verified yet! Please check your email.");
                    
                    // Kick them out
                    signOut(auth).then(() => {
                        router.visit(route('verify-email'));
                    });
                }
            } else {
                // No user found (not logged in at all)
                alert("Please log in to access the dashboard.");
                router.visit(route('login'));
            }
        });

        // Cleanup listener when leaving page
        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        signOut(auth).then(() => {
            console.log("User signed out from Firebase");
            router.visit('/login'); 
        }).catch((error) => {
            console.error("Logout error", error);
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            {/* Main Content Area */}
            <div className="py-8 min-h-screen bg-[#F4F6F9]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Row 1: KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {KPI_DATA.map((kpi, index) => (
                            <KPICard key={index} {...kpi} />
                        ))}
                    </div>

                    {/* Row 2: Heatmap & Distribution Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Heatmap takes up 2/3rds of the space */}
                        <div className="lg:col-span-2 min-h-[400px]">
                            <HeatmapSection />
                        </div>
                        {/* Distribution chart takes up 1/3rd */}
                        <div className="min-h-[400px]">
                            <DistributionChart />
                        </div>
                    </div>

                    {/* Row 3: Recent Activity Table */}
                    <RecentTable />

                </div>
            </div>
        </AuthenticatedLayout>
    );
}