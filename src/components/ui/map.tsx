import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ZoomIn, ZoomOut, Locate } from 'lucide-react';

interface MapProps {
  center: [number, number];
  zoom: number;
  styles: {
    dark: string;
    light: string;
  };
  children?: React.ReactNode;
}

interface MapContextType {
  map: maplibregl.Map | null;
  markers: Map<string, maplibregl.Marker>;
}

const MapContext = React.createContext<MapContextType>({
  map: null,
  markers: new Map(),
});

export const InteractiveMap: React.FC<MapProps> = ({ center, zoom, styles, children }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    const instance = new maplibregl.Map({
      container: mapContainer.current,
      style: styles.dark,
      center,
      zoom,
      attributionControl: false,
    });

    setMapInstance(instance);

    instance.on('load', () => {
      instance.resize();
      setIsReady(true);
    });

    const resizeFrame = requestAnimationFrame(() => {
      instance.resize();
    });

    return () => {
      cancelAnimationFrame(resizeFrame);
      instance.remove();
      setMapInstance(null);
      setIsReady(false);
    };
  }, []);

  return (
    <MapContext.Provider value={{ map: mapInstance, markers: markers.current }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: '#0a0a0a',
        }}
      >
        <div
          ref={mapContainer}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
        {isReady && children}
      </div>
    </MapContext.Provider>
  );
};

interface MapMarkerProps {
  longitude: number;
  latitude: number;
  children?: React.ReactNode;
}

export const MapMarker: React.FC<MapMarkerProps> = ({ longitude, latitude, children }) => {
  const { map } = React.useContext(MapContext);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!map || !elementRef.current) return;

    const el = document.createElement('div');
    el.style.width = '50px';
    el.style.height = '50px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';

    // Mount React content into the element
    const root = elementRef.current;
    root.appendChild(el);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([longitude, latitude])
      .addTo(map);

    markerRef.current = marker;

    return () => {
      marker.remove();
      root.removeChild(el);
    };
  }, [map, longitude, latitude]);

  return (
    <div
      ref={elementRef}
      style={{
        position: 'absolute',
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  );
};

interface MarkerContentProps {
  children?: React.ReactNode;
}

export const MarkerContent: React.FC<MarkerContentProps> = ({ children }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
};

interface MarkerLabelProps {
  position?: 'top' | 'bottom';
  children?: React.ReactNode;
}

export const MarkerLabel: React.FC<MarkerLabelProps> = ({ position = 'bottom', children }) => {
  return (
    <div
      style={{
        position: 'absolute',
        [position]: position === 'bottom' ? -24 : 'auto',
        [position === 'bottom' ? 'top' : 'bottom']: position === 'bottom' ? 'auto' : -24,
        left: '50%',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
        pointerEvents: 'auto',
      }}
    >
      {children}
    </div>
  );
};

interface MarkerPopupProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const MarkerPopup: React.FC<MarkerPopupProps> = ({ children, className, style }) => {
  return (
    <div
      className={className}
      style={{
        pointerEvents: "auto",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

interface MapControlsProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showZoom?: boolean;
  showLocate?: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  position = 'top-right',
  showZoom = true,
  showLocate = true,
}) => {
  const { map } = React.useContext(MapContext);

  const positionMap = {
    'top-left': { top: 12, left: 12 },
    'top-right': { top: 12, right: 12 },
    'bottom-left': { bottom: 12, left: 12 },
    'bottom-right': { bottom: 12, right: 12 },
  };

  if (!map) return null;

  const handleZoomIn = () => {
    map.zoomTo(map.getZoom() + 1);
  };

  const handleZoomOut = () => {
    map.zoomTo(map.getZoom() - 1);
  };

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        map.flyTo({
          center: [longitude, latitude],
          zoom: 15,
        });
      });
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...positionMap[position],
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {showZoom && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={handleZoomIn}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              padding: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <ZoomIn size={18} />
          </button>
          <div style={{ height: 1, background: '#2a2a2a' }} />
          <button
            onClick={handleZoomOut}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              padding: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <ZoomOut size={18} />
          </button>
        </div>
      )}

      {showLocate && (
        <button
          onClick={handleLocate}
          style={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: 8,
            color: '#fff',
            padding: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a';
          }}
        >
          <Locate size={18} />
        </button>
      )}
    </div>
  );
};
