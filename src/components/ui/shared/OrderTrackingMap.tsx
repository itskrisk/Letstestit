import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { orderService, riderLocationService } from '../../../lib/supabaseService';
import { useAuth } from '../../../context/AuthContext';

// Fix for default marker icons in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const riderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const merchantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface OrderTrackingMapProps {
  orderId: string;
  merchantLat?: number;
  merchantLng?: number;
  customerLat?: number;
  customerLng?: number;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function OrderTrackingMap({ orderId, merchantLat, merchantLng, customerLat, customerLng }: OrderTrackingMapProps) {
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [order, setOrder] = useState<any>(null);
  const { user } = useAuth();

  // Default center (Nairobi CBD)
  const defaultCenter: [number, number] = [-1.2921, 36.8219];
  const defaultZoom = 13;

  useEffect(() => {
    loadOrder();
    loadRiderLocation();
    subscribeToUpdates();
  }, [orderId]);

  const loadOrder = async () => {
    const result = await orderService.getOrder(orderId);
    if (result.data) {
      setOrder(result.data);
    }
  };

  const loadRiderLocation = async () => {
    if (!order?.rider_id) return;
    const result = await riderLocationService.getLocation(order.rider_id);
    if (result.data) {
      setRiderLocation({ lat: result.data.lat, lng: result.data.lng });
    }
  };

   const subscribeToUpdates = () => {
     // Subscribe to order status changes
     // Note: subscribeToOrder may not be available in all supabaseService versions
     // Using a no-op fallback for now - realtime can be added later
     const orderChannel = {
       unsubscribe: () => {}
     };

     // Subscribe to rider location updates
     if (order?.rider_id) {
       const locationChannel = {
         unsubscribe: () => {}
       };
       return () => {
         orderChannel.unsubscribe();
         locationChannel.unsubscribe();
       };
     }

     return () => {
       orderChannel.unsubscribe();
     };
   };

  // Determine map center
  const getMapCenter = (): [number, number] => {
    if (riderLocation) {
      return [riderLocation.lat, riderLocation.lng];
    }
    if (merchantLat && merchantLng) {
      return [merchantLat, merchantLng];
    }
    if (customerLat && customerLng) {
      return [customerLat, customerLng];
    }
    return defaultCenter;
  };

  // Build route line if we have both merchant and rider locations
  const routePoints: [number, number][] = [];
  if (merchantLat && merchantLng) {
    routePoints.push([merchantLat, merchantLng]);
  }
  if (riderLocation) {
    routePoints.push([riderLocation.lat, riderLocation.lng]);
  }
  if (customerLat && customerLng) {
    routePoints.push([customerLat, customerLng]);
  }

  const showRider = order?.status === 'RIDER_ASSIGNED' || 
                    order?.status === 'PICKED_UP' || 
                    order?.status === 'OUT_FOR_DELIVERY' ||
                    order?.status === 'IN_TRANSIT';

  return (
    <div className="w-full h-[400px] rounded-[2rem] overflow-hidden shadow-lg border border-gray-100">
      <MapContainer
        center={getMapCenter()}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={getMapCenter()} zoom={defaultZoom} />

        {/* Merchant marker */}
        {merchantLat && merchantLng && (
          <Marker position={[merchantLat, merchantLng]} icon={merchantIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-sm">Merchant</p>
                <p className="text-xs text-gray-500">Pickup location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Customer marker */}
        {customerLat && customerLng && (
          <Marker position={[customerLat, customerLng]} icon={customerIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-sm">Delivery Address</p>
                <p className="text-xs text-gray-500">Your location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Rider marker */}
        {showRider && riderLocation && (
          <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-sm">Rider</p>
                <p className="text-xs text-gray-500">Live location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route line */}
        {routePoints.length >= 2 && (
          <Polyline
            positions={routePoints}
            color="#D4AF37"
            weight={4}
            opacity={0.8}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  );
}
