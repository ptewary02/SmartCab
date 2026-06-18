import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';

export default function EarningsHistory() {
  const navigate = useNavigate();
  const [trips, setTrips]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);

  useEffect(() => {
    api.get('/trips/mine')
      .then(({ data }) => {
        const completed = data.trips.filter((t) => t.status === 'completed');
        setTrips(completed);
        setTotal(completed.reduce((sum, t) => sum + (t.fare || 0), 0));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={s.wrap}>
      <Navbar />
      <div style={s.inner}>
        <h2 style={s.title}>Earnings</h2>

        <div style={s.totalCard}>
          <p style={s.totalLabel}>Total Earned</p>
          <p style={s.totalAmt}>₹{total}</p>
          <p style={s.totalTrips}>{trips.length} completed trips</p>
        </div>

        {loading && <p style={s.hint}>Loading...</p>}
        {!loading && !trips.length && <p style={s.hint}>No completed trips yet.</p>}

        {trips.map((t) => (
          <div key={t._id} style={s.card}>
            <div>
              <p style={s.addr}>{t.pickup?.address || 'Pickup'} → {t.destination?.address || 'Destination'}</p>
              <p style={s.date}>{new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            </div>
            <p style={s.fare}>₹{t.fare}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  wrap:       { minHeight: '100vh', background: '#0D1B2A' },
  inner:      { padding: '1rem', maxWidth: 430, margin: '0 auto' },
  title:      { fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 1rem' },
  totalCard:  { background: '#1B263B', borderRadius: 16, padding: '1.5rem', textAlign: 'center', marginBottom: '1.25rem', border: '1px solid #2a3a50' },
  totalLabel: { fontSize: 13, color: '#7a8fa6', margin: '0 0 8px' },
  totalAmt:   { fontSize: 40, fontWeight: 700, color: '#F28C28', margin: '0 0 4px' },
  totalTrips: { fontSize: 13, color: '#7a8fa6', margin: 0 },
  hint:       { fontSize: 14, color: '#7a8fa6', textAlign: 'center', marginTop: '3rem' },
  card:       { background: '#1B263B', borderRadius: 12, padding: '1rem', marginBottom: 8, border: '1px solid #2a3a50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  addr:       { fontSize: 13, color: '#c0d0e0', margin: '0 0 4px', maxWidth: 260 },
  date:       { fontSize: 11, color: '#7a8fa6', margin: 0 },
  fare:       { fontSize: 16, fontWeight: 700, color: '#F28C28', flexShrink: 0 },
};
