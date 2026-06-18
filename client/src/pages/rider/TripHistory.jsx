import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';

const STATUS_COLOR = { requested:'#F28C28', accepted:'#3b82f6', ongoing:'#8b5cf6', completed:'#22c55e', cancelled:'#ef4444' };

export default function TripHistory() {
  const navigate     = useNavigate();
  const [trips, setTrips]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/trips/mine')
      .then(({ data }) => setTrips(data.trips))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={s.wrap}>
      <Navbar />
      <div style={s.inner}>
        <h2 style={s.title}>Trip History</h2>

        {loading && <p style={s.hint}>Loading...</p>}
        {!loading && !trips.length && <p style={s.hint}>No trips yet. Book your first ride!</p>}

        {trips.map((t) => (
          <div key={t._id} style={s.card}>
            <div style={s.top}>
              <span style={{ ...s.badge, background: STATUS_COLOR[t.status] + '22', color: STATUS_COLOR[t.status] }}>
                {t.status}
              </span>
              <span style={s.date}>{new Date(t.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
            </div>
            <div style={s.route}>
              <div style={s.routeRow}><span style={s.dotP} /><p style={s.addr}>{t.pickup?.address || 'Pickup'}</p></div>
              <div style={s.routeLine} />
              <div style={s.routeRow}><span style={s.dotD} /><p style={s.addr}>{t.destination?.address || 'Destination'}</p></div>
            </div>
            <div style={s.bottom}>
              <span style={s.info}>{t.route?.distanceKm || '—'} km · {t.route?.etaMinutes || '—'} min</span>
              {t.fare > 0 && <span style={s.fare}>₹{t.fare}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  wrap:     { minHeight: '100vh', background: '#0D1B2A' },
  inner:    { padding: '1rem', maxWidth: 430, margin: '0 auto' },
  title:    { fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 1rem' },
  hint:     { fontSize: 14, color: '#7a8fa6', textAlign: 'center', marginTop: '3rem' },
  card:     { background: '#1B263B', borderRadius: 14, padding: '1rem', marginBottom: 10, border: '1px solid #2a3a50' },
  top:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge:    { fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 600, textTransform: 'capitalize' },
  date:     { fontSize: 12, color: '#7a8fa6' },
  route:    { marginBottom: 10 },
  routeRow: { display: 'flex', alignItems: 'center', gap: 8 },
  routeLine:{ width: 2, height: 16, background: '#2a3a50', marginLeft: 9, marginBottom: 2 },
  dotP:     { width: 20, height: 20, borderRadius: '50%', background: '#F28C28', display: 'inline-block', flexShrink: 0 },
  dotD:     { width: 20, height: 20, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 },
  addr:     { fontSize: 13, color: '#c0d0e0', margin: 0 },
  bottom:   { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #2a3a50', paddingTop: 8 },
  info:     { fontSize: 12, color: '#7a8fa6' },
  fare:     { fontSize: 14, fontWeight: 700, color: '#F28C28' },
};
