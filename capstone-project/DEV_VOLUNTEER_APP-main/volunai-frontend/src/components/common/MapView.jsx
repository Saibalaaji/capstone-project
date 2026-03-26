import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize, Minimize } from 'lucide-react';

// Fix for default marker icon in leaflet under React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom markers matching the warm theme
const requestMarker = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const volMarker = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Sub-component to dynamically recenter map when selectedCityCenter changes
function MapCenterer({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo([center.lat, center.lng || center.lon], 13, { duration: 1.5 });
        }
    }, [center, map]);
    return null;
}

export default function MapView({ selectedCityCenter, activeRequests = [], volunteers = [] }) {
    // Default fallback to center of somewhere if null
    const defaultCenter = selectedCityCenter || { lat: 9.9252, lng: 78.1198 }; // Madurai
    const [isMapFullScreen, setIsMapFullScreen] = useState(false);

    useEffect(() => {
        // To ensure Leaflet map correctly resets size after the DOM changes scale/height
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 50);
        return () => clearTimeout(timer);
    }, [isMapFullScreen]);

    return (
        <div 
            className={isMapFullScreen 
                ? "fixed inset-0 z-[2000] w-screen h-screen m-0 rounded-none shadow-none flex flex-col bg-white" 
                : "card"} 
            style={isMapFullScreen ? {} : { padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Live Request Map
                </h3>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fb923c' }} /> Requests</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ca02c' }} /> Volunteers</div>
                </div>
            </div>
            
            <div className="relative z-0 w-full" style={isMapFullScreen ? { flex: 1 } : { height: 350 }}>
                <button
                    onClick={() => setIsMapFullScreen(!isMapFullScreen)}
                    className="absolute top-4 right-4 z-[1000] p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-all"
                    title={isMapFullScreen ? "Exit Fullscreen" : "View Fullscreen"}
                >
                    {isMapFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
                <MapContainer 
                    center={[defaultCenter.lat, defaultCenter.lng || defaultCenter.lon]} 
                    zoom={12} 
                    style={{ height: '100%', width: '100%' }}
                    className="h-full w-full"
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />
                    
                    <MapCenterer center={defaultCenter} />

                    {activeRequests.map((req, i) => {
                        // Leaflet needs proper valid lat/lng numbers. Ensure they exist.
                        if (!req.lat || !req.lng) return null;
                        
                        return (
                            <Marker 
                                key={`req-${req.id || i}`} 
                                position={[req.lat, req.lng]}
                                icon={requestMarker}
                            >
                                <Popup className="rounded-xl">
                                    <div style={{ padding: '4px', textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, fontWeight: 800, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Active Request
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                                            {req.service_type || 'Assistance Needed'}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                                            ID: #{req.id} • {req.status}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {volunteers.map((vol, i) => {
                        // Support backend `latitude`/`longitude` alongside short-hand `lat`/`lng`
                        const vLat = vol.latitude || vol.lat;
                        const vLng = vol.longitude || vol.lng;
                        if (!vLat || !vLng) return null;

                        return (
                            <Marker 
                                key={`vol-${vol.id || i}`} 
                                position={[vLat, vLng]}
                                icon={volMarker}
                            >
                                <Popup className="rounded-xl">
                                    <div style={{ padding: '4px', textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, fontWeight: 800, color: '#2ca02c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Volunteer
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                                            {vol.name || 'Anonymous User'}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                                            Rating: ⭐{(vol.rating || 0).toFixed(1)}
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                                            Status: {vol.availabilityStatus || 'UNKNOWN'}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
}
