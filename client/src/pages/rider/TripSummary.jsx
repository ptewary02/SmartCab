import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import useTripStore from '../../store/tripStore';
import StarRating from '../../components/StarRating';

export default function TripSummary() {
  const navigate = useNavigate();
  const { currentTrip, clearTrip } = useTripStore();
  const [rating, setRating] = useState(0);
  const [rated, setRated]   = useState(false);
  const [loading, setLoading] = useState(false);

  const submitRating = async () => {
    if (!rating) return toast.error('Please select a rating');
    setLoading(true);
    try {
      await api.patch(`/trips/${currentTrip._id}/rate`, { rating, ratingFor: 'driver' });
      setRated(true);
      toast.success('Thanks for your rating!');
    } catch (err) {
      toast.error('Could not submit rating');
    } finally {
      setLoading(false);
    }
  };

  const done = () => { clearTrip(); navigate('/'); };

  const fare = currentTrip?.fare || 0;

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.icon}>✅</div>
        <h2 style={s.title}>Trip Complete!</h2>
        <p style={s.sub}>You have arrived at your destination</p>

        <div style={s.fareBox}>
          <p style={s.fareLabel}>Total Fare</p>
          <p style={s.fareAmt}>₹{fare}</p>
        </div>

        <div style={s.details}>
          <div style={s.row}><span style={s.key}>From</span><span style={s.val}>{currentTrip?.pickup?.address || '—'}</span></div>
          <div style={s.row}><span style={s.key}>To</span><span style={s.val}>{currentTrip?.destination?.address || '—'}</span></div>
          <div style={s.row}><span style={s.key}>Distance</span><span style={s.val}>{currentTrip?.route?.distanceKm || '—'} km</span></div>
          <div style={s.row}><span style={s.key}>Duration</span><span style={s.val}>{currentTrip?.route?.etaMinutes || '—'} min</span></div>
        </div>

        {!rated ? (
          <>
            <p style={s.rateTitle}>Rate your driver</p>
            <StarRating value={rating} onChange={setRating} />
            <button onClick={submitRating} disabled={loading || !rating} style={s.rateBtn}>
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </>
        ) : (
          <div style={s.thankBox}>
            <p style={s.thankText}>⭐ Thanks for rating!</p>
          </div>
        )}

        <button onClick={done} style={s.doneBtn}>Back to Home</button>
        <button onClick={() => navigate('/history')} style={s.histBtn}>View Trip History</button>
      </div>
    </div>
  );
}

const s = {
  wrap:      { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D1B2A', padding: '1rem' },
  card:      { background: '#1B263B', borderRadius: 20, padding: '2rem 1.5rem', width: '100%', maxWidth: 400, border: '1px solid #2a3a50' },
  icon:      { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  title:     { fontSize: 24, fontWeight: 700, color: '#fff', textAlign: 'center', margin: '0 0 6px' },
  sub:       { fontSize: 13, color: '#7a8fa6', textAlign: 'center', margin: '0 0 1.5rem' },
  fareBox:   { background: '#0D1B2A', borderRadius: 14, padding: '1rem', textAlign: 'center', marginBottom: '1.5rem' },
  fareLabel: { fontSize: 13, color: '#7a8fa6', margin: '0 0 4px' },
  fareAmt:   { fontSize: 36, fontWeight: 700, color: '#F28C28', margin: 0 },
  details:   { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.5rem' },
  row:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  key:       { fontSize: 13, color: '#7a8fa6' },
  val:       { fontSize: 13, color: '#fff', fontWeight: 500, textAlign: 'right', maxWidth: '60%' },
  rateTitle: { fontSize: 15, fontWeight: 600, color: '#fff', textAlign: 'center', margin: '0 0 12px' },
  rateBtn:   { width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: '#F28C28', color: '#0D1B2A', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 12 },
  thankBox:  { background: '#0D1B2A', borderRadius: 12, padding: '12px', textAlign: 'center', marginBottom: 12 },
  thankText: { fontSize: 15, color: '#F28C28', margin: 0, fontWeight: 600 },
  doneBtn:   { width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#F28C28', color: '#0D1B2A', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 12 },
  histBtn:   { width: '100%', padding: '10px', borderRadius: 12, border: '1px solid #2a3a50', background: 'none', color: '#7a8fa6', fontSize: 13, cursor: 'pointer', marginTop: 8 },
};
