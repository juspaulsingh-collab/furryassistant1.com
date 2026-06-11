import { useState, useCallback, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from "@react-google-maps/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface MapConfig {
  apiKey: string;
}

interface MarkerData {
  id: string | number;
  position: { lat: number; lng: number };
  title: string;
  icon?: string;
  onClick?: () => void;
}

interface RoutePoint {
  lat: number;
  lng: number;
}

interface GoogleMapComponentProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MarkerData[];
  routePoints?: RoutePoint[];
  showCurrentLocation?: boolean;
  height?: string;
  onMapClick?: (lat: number, lng: number) => void;
  selectedMarkerId?: string | number | null;
  onMarkerSelect?: (id: string | number | null) => void;
}

const defaultMapContainerStyle = {
  width: "100%",
  borderRadius: "8px",
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

export default function GoogleMapComponent({
  center,
  zoom = 14,
  markers = [],
  routePoints = [],
  showCurrentLocation = false,
  height = "300px",
  onMapClick,
  selectedMarkerId,
  onMarkerSelect,
}: GoogleMapComponentProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);

  const { data: mapConfig, isLoading: configLoading, error: configError } = useQuery<MapConfig>({
    queryKey: ["/api/config/maps"],
  });

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: mapConfig?.apiKey || "",
  });

  useEffect(() => {
    if (showCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [showCurrentLocation]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng && onMapClick) {
        onMapClick(e.latLng.lat(), e.latLng.lng());
      }
      if (onMarkerSelect) {
        onMarkerSelect(null);
      }
    },
    [onMapClick, onMarkerSelect]
  );

  if (configLoading) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ height }}
        data-testid="map-loading"
      >
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (configError || !mapConfig?.apiKey) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-lg text-muted-foreground text-sm p-4 text-center"
        style={{ height }}
        data-testid="map-error"
      >
        Map unavailable. Please check API configuration.
      </div>
    );
  }

  if (loadError) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-lg text-muted-foreground text-sm p-4 text-center"
        style={{ height }}
        data-testid="map-load-error"
      >
        Failed to load Google Maps. Please try again.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ height }}
        data-testid="map-loading"
      >
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ ...defaultMapContainerStyle, height }}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      options={mapOptions}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          title={marker.title}
          onClick={() => {
            if (onMarkerSelect) {
              onMarkerSelect(marker.id);
            }
            if (marker.onClick) {
              marker.onClick();
            }
          }}
        />
      ))}

      {selectedMarkerId && markers.find((m) => m.id === selectedMarkerId) && (
        <InfoWindow
          position={markers.find((m) => m.id === selectedMarkerId)!.position}
          onCloseClick={() => onMarkerSelect?.(null)}
        >
          <div className="p-1">
            <p className="font-medium text-gray-900">
              {markers.find((m) => m.id === selectedMarkerId)?.title}
            </p>
          </div>
        </InfoWindow>
      )}

      {routePoints.length > 1 && (
        <Polyline
          path={routePoints}
          options={{
            strokeColor: "#f97316",
            strokeOpacity: 1,
            strokeWeight: 4,
          }}
        />
      )}

      {routePoints.length > 0 && (
        <>
          <Marker
            position={routePoints[0]}
            title="Start"
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#22c55e",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            }}
          />
          {routePoints.length > 1 && (
            <Marker
              position={routePoints[routePoints.length - 1]}
              title="Current"
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#ef4444",
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 2,
              }}
            />
          )}
        </>
      )}

      {showCurrentLocation && currentPosition && (
        <Marker
          position={currentPosition}
          title="Your Location"
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#3b82f6",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 3,
          }}
        />
      )}
    </GoogleMap>
  );
}
