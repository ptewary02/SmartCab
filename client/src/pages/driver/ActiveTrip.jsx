import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import useTripStore from '../../store/tripStore';
import useSocket from '../../hooks/useSocket';
import Navbar from '../../components/Navbar';
import TripStatusBar from '../../components/TripStatusBar';

export default function ActiveTrip() {
  const navigate = useNavigate();
  const socket   = useSocket();
  const { currentTrip, tripStatus, setTripStatus, clearTrip } = useTripStore();
  const [loading, setLoading] = useState(false);

  if (!currentTrip) { navigate('/driver'); return null; }

  const startTrip = async () => {
    setLoading(true);
    try {
      await api.patch(`/trips/${currentTrip._id}/start`);
      setTripStatus('ongoing');
      socket?.emit('trip:driverStarted', { tripId: currentTrip._id });
      toast.success('Trip started!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start trip');
    } finally {
      setLoading(false);
    }
  };

  const completeTrip = async () => {
    setLoading(true);
    try {
      const { data } = await api.patch(`/trips/${currentTrip._id}/complete`);
      socket?.emit('trip:driverCompleted', { tripId: currentTrip._id, fare: data.fare });
      socket?.emit('trip:leave', { tripId: currentTrip._id });
      toast.success(`Trip complete! Earned ₹${data.fare}`);
      clearTrip();
      navigate('/driver');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not complete trip');
    } finally {
      setLoading(false);
    }
  };

  const status = tripStatus || currentTrip.status;

  return (
    <div style={s.wrap}>
      <Navbar minimal />
      <div style={s.inner}>
        <h2 style={s.title}>Active Trip</h2>
        <TripStatusBar status={status} />

        <div style={s.card}>
          <p style={s.cardLabel}>Rider</p>
          <p style={s.cardVal}>{currentTrip.riderId?.name || 'Rider'}</p>
        </div>

        <div style={s.card}>
          <div style={s.routeRow}><span style={s.dotP} /><div><p style={s.addrLabel}>Pickup</p><p style={s.addrVal}>{currentTrip.pickup?.address || '—'}</p></div></div>
          <div style={s.divider} />
          <div style={s.routeRow}><span style={s.dotD} /><div><p style={s.addrLabel}>Destination</p><p style={s.addrVal}>{currentTrip.destination?.address || '—'}</p></div></div>
        </div>

        {status === 'accepted' && (
          <button onClick={startTrip} disabled={loading} style={{ ...s.btn, background: '#3b82f6' }}>
            {loading ? 'Starting...' : '▶ Start Trip'}
          </button>
        )}

        {status === 'ongoing' && (
          <button onClick={completeTrip} disabled={loading} style={{ ...s.btn, background: '#22c55e' }}>
            {loading ? 'Completing...' : '✓ Complete Trip'}
          </button>
        )}

        <button onClick={() => navigate('/driver')} style={s.backBtn}>← Back to Home</button>
      </div>
    </div>
  );
}

const s = {
  wrap:      { minHeight: '100vh', background: '#0D1B2A' },
  inner:     { padding: '1rem', maxWidth: 430, margin: '0 auto' },
  title:     { fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 1rem' },
  card:      { background: '#1B263B', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: 10, border: '1px solid #2a3a50' },
  cardLabel: { fontSize: 11, color: '#7a8fa6', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' },
  cardVal:   { fontSize: 16, fontWeight: 600, color: '#fff', margin: 0 },
  routeRow:  { display: 'flex', alignItems: 'flex-start', gap: 12 },
  divider:   { height: 1, background: '#2a3a50', margin: '12px 0' },
  dotP:      { width: 24, height: 24, borderRadius: '50%', background: '#F28C28', display: 'inline-block', flexShrink: 0, marginTop: 2 },
  dotD:      { width: 24, height: 24, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0, marginTop: 2 },
  addrLabel: { fontSize: 11, color: '#7a8fa6', margin: '0 0 3px' },
  addrVal:   { fontSize: 14, color: '#fff', fontWeight: 500, margin: 0 },
  btn:       { width: '100%', padding: '14px', borderRadius: 12, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 16, marginBottom: 8 },
  backBtn:   { width: '100%', padding: '10px', borderRadius: 12, border: '1px solid #2a3a50', background: 'none', color: '#7a8fa6', fontSize: 13, cursor: 'pointer' },
};
