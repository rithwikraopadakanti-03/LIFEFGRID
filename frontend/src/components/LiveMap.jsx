import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Create custom SVG Leaflet div icons for high resolution
const createCustomIcon = (type, category) => {
  let bgColor = '#06b6d4'; // default cyan
  let iconHtml = '📍';

  if (type === 'Incident') {
    if (category === 'Flood') { bgColor = '#3b82f6'; iconHtml = '🌊'; }
    else if (category === 'Fire') { bgColor = '#ef4444'; iconHtml = '🔥'; }
    else if (category === 'Accident') { bgColor = '#f59e0b'; iconHtml = '💥'; }
    else if (category === 'Medical Emergency') { bgColor = '#ec4899'; iconHtml = '🚑'; }
    else { bgColor = '#a855f7'; iconHtml = '⚡'; }
  } else if (type === 'Hospital') {
    bgColor = '#10b981'; iconHtml = '🏥';
  } else if (type === 'Shelter') {
    bgColor = '#8b5cf6'; iconHtml = '🏕️';
  } else if (type === 'Ambulance') {
    bgColor = '#f43f5e'; iconHtml = '🚒';
  } else if (type === 'Police') {
    bgColor = '#2563eb'; iconHtml = '👮';
  } else if (type === 'FireStation') {
    bgColor = '#dc2626'; iconHtml = '🚒';
  } else if (type === 'Volunteer') {
    bgColor = '#14b8a6'; iconHtml = '🤝';
  }

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: ${bgColor};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 0 15px ${bgColor}88;
        border: 2px solid white;
        transform: translate(-50%, -50%);
      ">
        ${iconHtml}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
};

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function LiveMap({ incidents = [], resources = [], selectedIncident = null, onSelectIncident }) {
  const [userCoords, setUserCoords] = React.useState(null);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 4000 }
      );
    }
  }, []);

  // Center priority: Selected Incident > User Live GPS > Fallback Coordinates
  const centerLat = selectedIncident ? selectedIncident.latitude : (userCoords ? userCoords.lat : 16.5062);
  const centerLng = selectedIncident ? selectedIncident.longitude : (userCoords ? userCoords.lng : 80.6480);

  const userIcon = L.divIcon({
    className: 'custom-user-location-marker',
    html: `
      <div style="
        background: #0284c7;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 0 20px #38bdf8;
        border: 3px solid white;
        transform: translate(-50%, -50%);
        animation: pulse 2s infinite;
      ">
        📍
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={userCoords || selectedIncident ? 14 : 13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapRecenter center={[centerLat, centerLng]} />

        {/* Live User Location Marker */}
        {userCoords && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
            <Popup>
              <div className="p-1 text-center font-bold text-xs text-cyan-300">
                📍 YOU ARE HERE (Live Citizen GPS Telemetry)
              </div>
            </Popup>
          </Marker>
        )}

        {/* Heatmap/Risk Circles for Flood Incidents */}
        {incidents.filter(i => i.category === 'Flood').map((inc) => (
          <Circle
            key={`circle-${inc.id}`}
            center={[inc.latitude, inc.longitude]}
            radius={800}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.2,
              weight: 1.5,
              dashArray: '4, 4'
            }}
          />
        ))}

        {/* Incidents Markers */}
        {incidents.map((inc) => (
          <Marker
            key={`inc-${inc.id}`}
            position={[inc.latitude, inc.longitude]}
            icon={createCustomIcon('Incident', inc.category)}
            eventHandlers={{
              click: () => onSelectIncident && onSelectIncident(inc)
            }}
          >
            <Popup>
              <div className="p-1 space-y-2 min-w-[200px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-red-500/20 text-red-400 border border-red-500/40">
                    {inc.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: #{inc.id}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-100">{inc.title}</h4>
                <p className="text-xs text-slate-300 leading-snug">{inc.description}</p>
                <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Urgency: <strong className="text-amber-400">{inc.urgency}</strong></span>
                  <span>Severity: <strong className="text-red-400">{inc.severity_score}/10</strong></span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Resources Markers */}
        {resources.map((res) => (
          <Marker
            key={`res-${res.id}`}
            position={[res.latitude, res.longitude]}
            icon={createCustomIcon(res.type, null)}
          >
            <Popup>
              <div className="p-1 space-y-2 min-w-[210px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    {res.type}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">{res.status}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-100">{res.name}</h4>
                <p className="text-xs text-slate-300">{res.address}</p>
                <div className="text-xs text-cyan-400">
                  Capacity: {res.current_occupancy} / {res.capacity} ({res.capacity - res.current_occupancy} available)
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  📞 {res.contact_number}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Draw Route Line if Incident has matched resource */}
        {selectedIncident && selectedIncident.latitude && resources.length > 0 && (
          resources.filter(r => r.type === 'Hospital' || r.type === 'Ambulance').slice(0, 1).map(r => (
            <Polyline
              key={`route-${r.id}`}
              positions={[
                [selectedIncident.latitude, selectedIncident.longitude],
                [r.latitude, r.longitude]
              ]}
              pathOptions={{
                color: '#06b6d4',
                weight: 3,
                dashArray: '8, 8',
                opacity: 0.8
              }}
            />
          ))
        )}

      </MapContainer>

      {/* Map Overlay Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] glass-panel px-3 py-2 rounded-xl border border-slate-800 text-[11px] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> <span>Flood</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> <span>Fire</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> <span>Hospital</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> <span>Shelter</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> <span>Ambulance</span></div>
      </div>
    </div>
  );
}
