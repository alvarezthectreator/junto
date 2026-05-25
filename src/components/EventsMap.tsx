import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Layers } from 'lucide-react';
interface EventMarker {
  userInitial: string;
  userName: string;
  actionText: string;
  emoji: string;
  description: string;
  date: string;
  accentColor: string;
  coords: [number, number];
}
interface EventsMapProps {
  events: EventMarker[];
}
// Build a custom DivIcon for each event marker
function createMarkerIcon(initial: string | undefined, accentColor: string | undefined) {
  const displayInitial = initial || '♥';
  const displayColor = accentColor || '#F59E0B';
  
  // Extract a hex color from the tailwind-style accentColor string
  const colorMatch = displayColor.match(/#[0-9A-Fa-f]{6}/);
  const color = colorMatch ? colorMatch[0] : '#F59E0B';
  return L.divIcon({
    className: 'junto-marker',
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        transform: translate(-50%, -100%);
      ">
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50% 50% 50% 0;
          background: ${color};
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          border: 2px solid rgba(255,255,255,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            color: white;
            font-weight: 700;
            font-family: 'Playfair Display', serif;
            font-size: 16px;
          ">${displayInitial}</span>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [0, 0]
  });
}
export function EventsMap({ events }: EventsMapProps) {
  // Center on Lagos
  const center: [number, number] = [6.435, 3.435];
  return (
    <div className="bg-[#1A1A21] border border-white/5 rounded-3xl overflow-hidden relative">
      {/* Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between pointer-events-none">
        <div className="bg-[#0F0F13]/80 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 pointer-events-auto">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse"></div>
          <p className="text-sm text-white font-medium">
            {events.length} events near you
          </p>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button className="bg-[#0F0F13]/80 backdrop-blur-md border border-white/10 rounded-full p-2.5 text-gray-300 hover:text-white hover:bg-[#0F0F13] transition-colors">
            <Layers size={16} />
          </button>
          <button className="bg-[#0F0F13]/80 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-xs font-medium text-white hover:bg-[#0F0F13] transition-colors flex items-center gap-1.5">
            <MapPin size={14} className="text-[#F59E0B]" />
            Lagos
          </button>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        style={{
          height: '400px',
          width: '100%',
          background: '#0F0F13'
        }}
        attributionControl={false}>
        
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        {events.map((event, idx) =>
        <Marker
          key={idx}
          position={event.coords}
          icon={createMarkerIcon(event.userInitial, event.accentColor)}>
          
            <Popup>
              <div
              style={{
                minWidth: '180px',
                fontFamily: 'Inter, sans-serif'
              }}>
              
                <div
                style={{
                  fontWeight: 600,
                  marginBottom: 4
                }}>
                
                  {event.userName} wants to {event.actionText} {event.emoji}
                </div>
                <div
                style={{
                  fontSize: 12,
                  color: '#666',
                  marginBottom: 6
                }}>
                
                  {event.description}
                </div>
                <div
                style={{
                  fontSize: 11,
                  color: '#999'
                }}>
                
                  📅 {event.date}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Footer Overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] flex items-center justify-between pointer-events-none">
        <div className="bg-[#0F0F13]/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 pointer-events-auto">
          <p className="text-[10px] text-gray-400">Tap a pin to see the vibe</p>
        </div>
        <div className="flex items-center gap-3 bg-[#0F0F13]/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 pointer-events-auto">
          {events.slice(0, 4).map((event, idx) => {
            const colorMatch = event.accentColor.match(/#[0-9A-Fa-f]{6}/);
            const color = colorMatch ? colorMatch[0] : '#F59E0B';
            return (
              <div key={idx} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: color
                  }}>
                </div>
                <span className="text-[10px] text-gray-300">
                  {event.actionText.split(' ')[0]}
                </span>
              </div>);

          })}
        </div>
      </div>
    </div>);

}