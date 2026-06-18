import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import toast from 'react-hot-toast';
import useSocket from '../../hooks/useSocket';
import useTripStore from '../../store/tripStore';
import TripStatusBar from '../../components/TripStatusBar';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';

export default function LiveTracking() {
  const navigate  = useNavigate();
  const socket    = useSocket();
  const { currentTrip, driverLocation, setDriverLocation, setTripStatus, setAssignedDriver, assignedDriver, tripStatus, clearTrip } = useTripStore();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
  });

  const [eta, setEta] = useState(null);

  useEffect(() => {
    if (!socket || !currentTrip?._id) return;

    // Join the trip room
    socket.emit('trip:join', { tripId: currentTrip._id });

    // Driver accepted
    socket.on('trip:accepted', ({ driver }) => {
      setAssignedDriver(driver);
      setTripStatus('accepted');
      toast.success(`Driver ${driver.name} is on the way!`);
    });

    // Driver location updates
    socket.on('driver:locationUpdate', ({ lat, lng }) => {
      setDriverLocation({ lat, lng });
    });

    // Trip started
    socket.on('trip:started', () => {
      setTripStatus('ongoing');
      toast.success('Your trip has started!');
    });

    // Trip completed
    socket.on('trip:completed', ({ fare }) => {
      setTripStatus('completed');
      toast.success(`Trip complete! Fare: ₹${fare}`);
      socket.emit('trip:leave', { tripId: currentTrip._id });
      navigate('/summary');
    });

    // Cancelled
    socket.on('trip:cancelled', ({ by }) => {
      toast.error(`Trip cancelled by ${by}`);
      clearTrip();
      navigate('/');
    });

    // No drivers
    socket.on('trip:noDriversAvailable', ({ message }) => {
      toast.error(message);
      clearTrip();
      navigate('/');
    });

    return () => {
      socket.off('trip:accepted');
      socket.off('driver:locationUpdate');
      socket.off('trip:started');
      socket.off('trip:completed');
      socket.off('trip:cancelled');
      socket.off('trip:noDriversAvailable');
    };
  }, [socket, currentTrip?._id]);

  const cancelTrip = async () => {
    try {
      await api.patch(`/trips/${currentTrip._id}/cancel`);
      socket?.emit('trip:leave', { tripId: currentTrip._id });
      clearTrip();
      toast.success('Trip cancelled');
      navigate('/');
    } catch (err) {
      toast.error('Could not cancel trip');
    }
  };

  const pickup = currentTrip?.pickup;
  const dest   = currentTrip?.destination;

  return (
    <div style={s.wrap}>
      <Navbar minimal />

      {/* Map */}
      <div style={s.mapWrap}>
        {isLoaded && pickup ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={driverLocation || pickup}
            zoom={15}
            options={{ styles: darkMapStyle, disableDefaultUI: true, zoomControl: true }}
          >
            <Marker position={pickup} label="P" />
            {dest && <Marker position={dest} label="D" />}
            {driverLocation && (
              <Marker
                position={driverLocation}
                icon={{ url: 'https://maps.google.com/mapfiles/kml/shapes/cabs.png', scaledSize: { width: 40, height: 40 } }}
              />
            )}
          </GoogleMap>
        ) : (
          <div style={s.placeholder}><p style={{ color: '#7a8fa6' }}>Loading map...</p></div>
        )}
      </div>

      {/* Status panel */}
      <div style={s.panel}>
        <TripStatusBar status={tripStatus || currentTrip?.status} />

        {tripStatus === 'requested' && (
          <div style={s.waiting}>
            <div style={s.spinner} />
            <p style={s.waitText}>Finding your driver...</p>
            <p style={s.waitSub}>Our algorithm is matching the best driver near you</p>
          </div>
        )}

        {assignedDriver && (
          <div style={s.driverCard}>
            <div style={s.driverAvatar}>🧑‍✈️</div>
            <div style={{ flex: 1 }}>
              <p style={s.driverName}>{assignedDriver.name}</p>
              <p style={s.driverInfo}>⭐ {assignedDriver.rating?.toFixed(1)} · {assignedDriver.vehicleType}</p>
            </div>
            <div style={s.etaBadge}>
              <p style={s.etaNum}>{eta || '~5'}</p>
              <p style={s.etaLabel}>min</p>
            </div>
          </div>
        )}

        <div style={s.tripInfo}>
          <div style={s.tripRow}>
            <span style={s.dot('P', '#F28C28')} />
            <p style={s.addr}>{pickup?.address || 'Pickup location'}</p>
          </div>
          <div style={s.tripRow}>
            <span style={s.dot('D', '#ef4444')} />
            <p style={s.addr}>{dest?.address || 'Destination'}</p>
          </div>
        </div>

        {['requested', 'accepted'].includes(tripStatus || currentTrip?.status) && (
          <button onClick={cancelTrip} style={s.cancelBtn}>Cancel Trip</button>
        )}
      </div>
    </div>
  );
}

const s = {
  wrap:       { display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D1B2A', maxWidth: 430, margin: '0 auto' },
  mapWrap:    { flex: 1, overflow: 'hidden' },
  placeholder:{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1B263B' },
  panel:      { background: '#1B263B', borderRadius: '20px 20px 0 0', padding: '1.25rem', borderTop: '1px solid #2a3a50', maxHeight: '50vh', overflowY: 'auto' },
  waiting:    { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' },
  spinner:    { width: 36, height: 36, border: '3px solid #2a3a50', borderTop: '3px solid #F28C28', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 12 },
  waitText:   { fontSize: 16, fontWeight: 600, color: '#fff', margin: '0 0 4px' },
  waitSub:    { fontSize: 12, color: '#7a8fa6', textAlign: 'center', margin: 0 },
  driverCard: { display: 'flex', alignItems: 'center', gap: 12, background: '#0D1B2A', borderRadius: 14, padding: '12px 14px', marginBottom: 12 },
  driverAvatar:{ fontSize: 32 },
  driverName: { fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 3px' },
  driverInfo: { fontSize: 12, color: '#7a8fa6', margin: 0 },
  etaBadge:   { background: '#F28C28', borderRadius: 10, padding: '6px 10px', textAlign: 'center' },
  etaNum:     { fontSize: 18, fontWeight: 700, color: '#0D1B2A', margin: 0 },
  etaLabel:   { fontSize: 10, color: '#0D1B2A', margin: 0 },
  tripInfo:   { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  tripRow:    { display: 'flex', alignItems: 'center', gap: 10 },
  dot:        (label, color) => ({ width: 24, height: 24, borderRadius: '50%', background: color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }),
  addr:       { fontSize: 13, color: '#c0d0e0', margin: 0 },
  cancelBtn:  { width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0D1B2A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7a8fa6' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1B263B' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#003366' }] },
];
