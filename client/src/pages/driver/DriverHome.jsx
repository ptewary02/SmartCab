import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useTripStore from '../../store/tripStore';
import useSocket from '../../hooks/useSocket';
import useDriverLocation from '../../hooks/useDriverLocation';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';

export default function DriverHome() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const { setTrip } = useTripStore();
  const socket    = useSocket();

  const [isOnline, setIsOnline]     = useState(false);
  const [toggling, setToggling]     = useState(false);
  const [incomingTrip, setIncoming] = useState(null);
  const [accepting, setAccepting]   = useState(false);

  const { location, error, accuracy } = useDriverLocation(isOnline);

  // Listen for incoming trip requests
  useEffect(() => {
    if (!socket) return;
    socket.on('trip:newRequest', (data) => {
      setIncoming(data);
      toast('🚗 New ride request!', { icon: '🔔' });
    });
    return () => socket.off('trip:newRequest');
  }, [socket]);

  const toggleOnline = async () => {
    setToggling(true);
    try {
      const { data } = await api.patch('/drivers/toggle');
      setIsOnline(data.isAvailable);
      toast.success(data.isAvailable ? 'You are now online!' : 'You are now offline');
    } catch (err) {
      toast.error('Could not update status');
    } finally {
      setToggling(false);
    }
  };

  const acceptTrip = async () => {
    if (!incomingTrip) return;
    setAccepting(true);
    try {
      const { data } = await api.patch(`/trips/${incomingTrip.tripId}/accept`);
      setTrip(data.trip);
      socket?.emit('trip:join', { tripId: incomingTrip.tripId });
      toast.success('Trip accepted!');
      navigate('/driver/trip');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept trip');
    } finally {
      setAccepting(false);
      setIncoming(null);
    }
  };

  const rejectTrip = () => {
    setIncoming(null);
    toast('Trip rejected', { icon: '❌' });
  };

  return (
    <div style={s.wrap}>
      <Navbar />
      <div style={s.inner}>

        {/* Greeting */}
        <div style={s.greeting}>
          <div>
            <p style={s.hi}>Hello, {user?.name?.split(' ')[0]} 👋</p>
            <p style={s.role}>Driver Dashboard</p>
          </div>
          <div style={{ ...s.statusDot, background: isOnline ? '#22c55e' : '#6b7280' }} />
        </div>

        {/* Online toggle */}
        <div style={{ ...s.toggleCard, borderColor: isOnline ? '#22c55e' : '#2a3a50' }}>
          <div>
            <p style={s.toggleTitle}>{isOnline ? '🟢 Online' : '⚫ Offline'}</p>
            <p style={s.toggleSub}>{isOnline ? 'Receiving ride requests' : 'Go online to earn'}</p>
          </div>
          <button onClick={toggleOnline} disabled={toggling} style={{ ...s.toggleBtn, background: isOnline ? '#ef4444' : '#22c55e' }}>
            {toggling ? '...' : isOnline ? 'Go Offline' : 'Go Online'}
          </button>
        </div>

        {/* Live GPS */}
        {isOnline && (
          <div style={s.gpsCard}>
            <p style={s.sectionLabel}>📡 Live Location</p>
            {error && <p style={s.err}>⚠️ {error}</p>}
            {!error && !location && <p style={s.gpsHint}>Getting GPS fix...</p>}
            {location && (
              <>
                <div style={s.coords}>
                  <div><p style={s.coordLabel}>Latitude</p><p style={s.coordVal}>{location.lat.toFixed(6)}</p></div>
                  <div><p style={s.coordLabel}>Longitude</p><p style={s.coordVal}>{location.lng.toFixed(6)}</p></div>
                </div>
                {accuracy && <p style={s.accuracy}>Accuracy ±{Math.round(accuracy)}m · Emitting every 3s</p>}
              </>
            )}
          </div>
        )}

        {/* Stats */}
        <div style={s.statsRow}>
          <div style={s.statCard}><p style={s.statNum}>0</p><p style={s.statLabel}>Today's trips</p></div>
          <div style={s.statCard}><p style={s.statNum}>₹0</p><p style={s.statLabel}>Today's earnings</p></div>
          <div style={s.statCard}><p style={s.statNum}>5.0⭐</p><p style={s.statLabel}>Rating</p></div>
        </div>

        {/* Navigation */}
        <button onClick={() => navigate('/driver/history')} style={s.histBtn}>View Earnings History</button>
        <button onClick={() => navigate('/profile')} style={s.histBtn}>My Profile</button>

      </div>

      {/* Incoming trip modal */}
      {incomingTrip && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <p style={s.modalTitle}>🚗 New Ride Request!</p>
            <p style={s.modalRider}>Rider: {incomingTrip.riderName}</p>
            <div style={s.modalRoute}>
              <div style={s.modalRow}><span style={s.dotP} /><p style={s.modalAddr}>{incomingTrip.pickup?.address || 'Pickup'}</p></div>
              <div style={s.modalRow}><span style={s.dotD} /><p style={s.modalAddr}>{incomingTrip.destination?.address || 'Destination'}</p></div>
            </div>
            <div style={s.modalBtns}>
              <button onClick={rejectTrip} style={s.rejectBtn}>✗ Reject</button>
              <button onClick={acceptTrip} disabled={accepting} style={s.acceptBtn}>
                {accepting ? '...' : '✓ Accept'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap:        { minHeight: '100vh', background: '#0D1B2A' },
  inner:       { padding: '1rem', maxWidth: 430, margin: '0 auto' },
  greeting:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  hi:          { fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 3px' },
  role:        { fontSize: 13, color: '#7a8fa6', margin: 0 },
  statusDot:   { width: 14, height: 14, borderRadius: '50%' },
  toggleCard:  { background: '#1B263B', borderRadius: 14, padding: '1rem 1.25rem', border: '1.5px solid', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  toggleTitle: { fontSize: 16, fontWeight: 600, color: '#fff', margin: '0 0 3px' },
  toggleSub:   { fontSize: 12, color: '#7a8fa6', margin: 0 },
  toggleBtn:   { padding: '9px 18px', borderRadius: 10, border: 'none', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  gpsCard:     { background: '#1B263B', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: 12, border: '1px solid #2a3a50' },
  sectionLabel:{ fontSize: 12, fontWeight: 600, color: '#7a8fa6', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' },
  err:         { color: '#ef4444', fontSize: 13 },
  gpsHint:     { color: '#7a8fa6', fontSize: 13 },
  coords:      { display: 'flex', gap: 24 },
  coordLabel:  { fontSize: 11, color: '#7a8fa6', margin: '0 0 2px' },
  coordVal:    { fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 },
  accuracy:    { fontSize: 11, color: '#7a8fa6', marginTop: 8 },
  statsRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 },
  statCard:    { background: '#1B263B', borderRadius: 12, padding: '12px 8px', textAlign: 'center', border: '1px solid #2a3a50' },
  statNum:     { fontSize: 16, fontWeight: 700, color: '#F28C28', margin: '0 0 4px' },
  statLabel:   { fontSize: 11, color: '#7a8fa6', margin: 0 },
  histBtn:     { width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #2a3a50', background: '#1B263B', color: '#c0d0e0', fontSize: 14, cursor: 'pointer', marginBottom: 8 },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 },
  modal:       { background: '#1B263B', borderRadius: '20px 20px 0 0', padding: '2rem 1.5rem', width: '100%', maxWidth: 430, border: '1px solid #2a3a50' },
  modalTitle:  { fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 6px' },
  modalRider:  { fontSize: 13, color: '#7a8fa6', margin: '0 0 1rem' },
  modalRoute:  { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.5rem' },
  modalRow:    { display: 'flex', alignItems: 'center', gap: 10 },
  dotP:        { width: 22, height: 22, borderRadius: '50%', background: '#F28C28', display: 'inline-block', flexShrink: 0 },
  dotD:        { width: 22, height: 22, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 },
  modalAddr:   { fontSize: 14, color: '#c0d0e0', margin: 0 },
  modalBtns:   { display: 'flex', gap: 10 },
  rejectBtn:   { flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: '#ef444422', color: '#ef4444', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  acceptBtn:   { flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: '#22c55e', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
};
