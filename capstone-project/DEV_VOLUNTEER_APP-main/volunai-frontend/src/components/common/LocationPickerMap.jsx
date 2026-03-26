import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
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

// Custom orange marker for selection
const selectionMarker = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function LocationMarker({ position, setPosition, setAddress }) {
    const map = useMap();

    // Re-center map when position changes from outside
    useEffect(() => {
        if (position && position.lat && position.lng) {
            map.flyTo([position.lat, position.lng], map.getZoom(), { duration: 0.5 });
        }
    }, [position, map]);

    useMapEvents({
        async click(e) {
            const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
            setPosition(newPos);
            
            // Reverse Geocoding via standard OSM Nominatim
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`);
                const data = await res.json();
                
                // Extract a clean city or display name
                let cleanAddress = data.display_name;
                if (data.address) {
                    cleanAddress = data.address.city || data.address.town || data.address.village || data.address.county || data.display_name.split(',')[0];
                }
                
                setAddress({ ...newPos, address: cleanAddress, display_name: data.display_name });
            } catch (err) {
                console.error("Geocoding failed", err);
                setAddress({ ...newPos, address: `${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`, display_name: '' });
            }
        },
    });

    return position === null ? null : (
        <Marker position={position} icon={selectionMarker} />
    );
}

export default function LocationPickerMap({ value, onChange, height = 250 }) {
    // Default to geographical center approx (e.g. Madurai) or a world view
    const defaultCenter = [9.9252, 78.1198];
    const [position, setPosition] = useState(null);
    const [isMapFullScreen, setIsMapFullScreen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 50);
        return () => clearTimeout(timer);
    }, [isMapFullScreen]);

    useEffect(() => {
        if (!value || !value.lat || !value.lng) {
            setPosition(null);
        } else if (!position || value.lat !== position.lat || value.lng !== position.lng) {
            setPosition({ lat: value.lat, lng: value.lng });
        }
    }, [value]);

    const handleSetAddress = (data) => {
        if (onChange) {
            onChange(data);
        }
    };

    const mapContent = (
        <>
            <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }} className="flex-1">
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                <LocationMarker position={position} setPosition={setPosition} setAddress={handleSetAddress} />
            </MapContainer>
            
            <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 1000, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <div style={{
                    background: 'rgba(255,255,255,0.95)', padding: '8px 12px', borderRadius: 8,
                    backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', pointerEvents: 'auto'
                }}>
                    📍 Click anywhere on the map to pin a location
                </div>
                {value?.address && (
                    <div className="animate-fade-in-up" style={{
                        background: 'var(--coral)', color: 'white', padding: '6px 12px', borderRadius: 8,
                        fontSize: 12, fontWeight: 800, alignSelf: 'flex-start', boxShadow: '0 2px 8px rgba(255,171,142,0.4)', pointerEvents: 'auto'
                    }}>
                        Selected: {value.address}
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={() => setIsMapFullScreen(!isMapFullScreen)}
                style={{ zIndex: 1001, pointerEvents: 'auto' }}
                className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-all"
                title={isMapFullScreen ? "Exit Fullscreen" : "View Fullscreen"}
            >
                {isMapFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
        </>
    );

    if (isMapFullScreen) {
        return createPortal(
            <div className="fixed inset-0 z-[9999] w-screen h-screen m-0 rounded-none shadow-none flex flex-col bg-white">
                {mapContent}
            </div>,
            document.body
        );
    }

    return (
        <div style={{ height, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', zIndex: 0, position: 'relative' }}>
            {mapContent}
        </div>
    );
}
