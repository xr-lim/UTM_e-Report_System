import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Crosshair, AlertCircle, Car } from 'lucide-react';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Distinct Pulsing Icon for User Location
const userIcon = new L.DivIcon({
    html: `
        <div class="relative flex items-center justify-center">
            <div class="absolute w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75"></div>
            <div class="relative w-3 h-3 bg-green-600 rounded-full border-2 border-white shadow-sm"></div>
        </div>
    `,
    className: 'user-location-marker',
    iconSize: [20, 20],
});

// --- Custom Icons for Report Types ---
const createCustomIcon = (color) => new L.DivIcon({
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
    className: 'custom-pin',
    iconSize: [12, 12],
});

const trafficIcon = createCustomIcon('#3b82f6'); // Blue
const suspiciousIcon = createCustomIcon('#ef4444'); // Red

// --- Component to handle Map Actions (Heatmap & Recentering) ---
const MapController = ({ points, userLocation }) => {
    const map = useMap();

    // Initialize Heatmap
    useEffect(() => {
        if (!map || !points.length) return;
        const heatLayer = L.heatLayer(points, {
            radius: 20,
            blur: 15,
            maxZoom: 17,
        }).addTo(map);

        return () => { map.removeLayer(heatLayer); };
    }, [map, points]);

    return null;
};

const ReportHeatmap = ({ reports }) => {
    const [mapInstance, setMapInstance] = useState(null);
    
    // UTM Skudai / Your Location Center
    const defaultCenter = [1.5632, 103.6424]; 

    const heatPoints = reports
        .filter(r => r.location?.latitude)
        .map(r => [r.location.latitude, r.location.longitude, 0.5]);

    const handleBackToLocation = () => {
        if (mapInstance) {
            mapInstance.flyTo(defaultCenter, 16, { animate: true });
        }
    };

    return (
        <div className="relative h-[500px] w-full rounded-xl overflow-hidden shadow-md border border-gray-200">
            {/* --- "Back to My Location" Floating Button --- */}
            <button
                onClick={handleBackToLocation}
                className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-all group"
                title="Back to My Location"
            >
                <Crosshair size={20} className="text-blue-600 group-hover:scale-110 transition-transform" />
            </button>

            <MapContainer 
                center={defaultCenter} 
                zoom={15} 
                className="h-full w-full"
                ref={setMapInstance}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* --- YOUR LOCATION PIN --- */}
                <Marker position={defaultCenter} icon={userIcon} zIndexOffset={1000}>
                    <Popup>
                        <div className="text-center font-bold text-blue-700">
                            You are here
                            <p className="text-[10px] text-gray-500 font-normal">Faculty of Computing</p>
                        </div>
                    </Popup>
                </Marker>

                <MapController points={heatPoints} />

                {/* --- Render Individual Pins --- */}
                {reports.map((report) => (
                    report.location?.latitude && (
                        <Marker 
                            key={report.id} 
                            position={[report.location.latitude, report.location.longitude]}
                            icon={report.type.toLowerCase() === 'traffic' ? trafficIcon : suspiciousIcon}
                        >
                            <Popup>
                                <div className="p-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {report.type === 'traffic' ? 
                                            <Car size={14} className="text-blue-600" /> : 
                                            <AlertCircle size={14} className="text-red-600" />
                                        }
                                        <span className="font-bold uppercase text-xs">{report.type}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2">{report.id}</p>
                                    <p className={`text-[10px] font-bold mt-1 uppercase ${
                                        report.status === 'resolved' ? 'text-green-600' : 'text-orange-500'
                                    }`}>
                                        Status: {report.status}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>

            {/* --- Map Legend --- */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-gray-200 text-[10px] space-y-1">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> <span>Traffic Violation</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> <span>Suspicious Activity</span>
                </div>
            </div>
        </div>
    );
};

export default ReportHeatmap;