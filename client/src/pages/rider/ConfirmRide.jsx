import { useNavigate } from 'react-router-dom';
import useTripStore from '../../store/tripStore';
import FareCard from '../../components/FareCard';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function ConfirmRide() {
  const navigate = useNavigate();
  const { route, setTrip } = useTripStore();
  const [booking, setBooking] = useState(false);

  if (!route) { navigate('/'); return null; }

  const book = async () => {
    setBooking(true);
    try {
      const { data } = await api.post('/trips', {
        pickup:      route.pickup,
        destination: route.destination,
      });
      setTrip(data.trip);
      toast.success('Ride requested!');
      navigate('/tracking');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div style={s.wrap}>
      <Navbar />
      <div style={s.inner}>
        <h2 style={s.title}>Confirm Ride</h2>
        <FareCard route={route} detailed />
        <button onClick={book} disabled={booking} style={s.btn}>
          {booking ? 'Booking...' : `Confirm — ₹${route.fareEstimate}`}
        </button>
        <button onClick={() => navigate('/')} style={s.back}>← Back</button>
      </div>
    </div>
  );
}

const s = {
  wrap:  { minHeight: '100vh', background: '#0D1B2A' },
  inner: { padding: '1rem', maxWidth: 430, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 1.5rem' },
  btn:   { width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#F28C28', color: '#0D1B2A', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 16 },
  back:  { width: '100%', padding: '10px', borderRadius: 12, border: '1px solid #2a3a50', background: 'none', color: '#7a8fa6', fontSize: 13, cursor: 'pointer', marginTop: 8 },
};
