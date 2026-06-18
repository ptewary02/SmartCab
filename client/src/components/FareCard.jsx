export default function FareCard({ route, detailed = false }) {
  if (!route) return null;

  return (
    <div style={s.card}>
      <div style={s.row}>
        <span style={s.label}>Estimated Fare</span>
        <span style={s.fare}>₹{route.fareEstimate}</span>
      </div>
      <div style={s.divider} />
      <div style={s.details}>
        <div style={s.detail}>
          <span style={s.icon}>📍</span>
          <div>
            <p style={s.detailLabel}>Distance</p>
            <p style={s.detailVal}>{route.distanceKm} km</p>
          </div>
        </div>
        <div style={s.detail}>
          <span style={s.icon}>⏱️</span>
          <div>
            <p style={s.detailLabel}>ETA</p>
            <p style={s.detailVal}>{route.etaMinutes} min</p>
          </div>
        </div>
        {route.surgeMultiplier > 1 && (
          <div style={s.detail}>
            <span style={s.icon}>⚡</span>
            <div>
              <p style={s.detailLabel}>Surge</p>
              <p style={{ ...s.detailVal, color: '#ef4444' }}>{route.surgeMultiplier}x</p>
            </div>
          </div>
        )}
      </div>

      {detailed && (
        <>
          <div style={s.divider} />
          <div style={s.breakdown}>
            <div style={s.bRow}><span style={s.bLabel}>Base fare</span><span style={s.bVal}>₹30</span></div>
            <div style={s.bRow}><span style={s.bLabel}>Distance ({route.distanceKm} km × ₹12)</span><span style={s.bVal}>₹{Math.round(route.distanceKm * 12)}</span></div>
            <div style={s.bRow}><span style={s.bLabel}>Time ({route.etaMinutes} min × ₹1.5)</span><span style={s.bVal}>₹{Math.round(route.etaMinutes * 1.5)}</span></div>
            {route.surgeMultiplier > 1 && (
              <div style={s.bRow}><span style={{ ...s.bLabel, color: '#ef4444' }}>Surge ({route.surgeMultiplier}x)</span><span style={{ ...s.bVal, color: '#ef4444' }}>applied</span></div>
            )}
          </div>
        </>
      )}

      {route.fromCache && (
        <p style={s.cache}>⚡ Cached route — instant result</p>
      )}
    </div>
  );
}

const s = {
  card:        { background: '#0D1B2A', borderRadius: 14, padding: '1rem', marginTop: 10, border: '1px solid #2a3a50' },
  row:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label:       { fontSize: 13, color: '#7a8fa6' },
  fare:        { fontSize: 24, fontWeight: 700, color: '#F28C28' },
  divider:     { height: 1, background: '#2a3a50', margin: '10px 0' },
  details:     { display: 'flex', gap: 16 },
  detail:      { display: 'flex', alignItems: 'center', gap: 8 },
  icon:        { fontSize: 18 },
  detailLabel: { fontSize: 11, color: '#7a8fa6', margin: 0 },
  detailVal:   { fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 },
  breakdown:   { display: 'flex', flexDirection: 'column', gap: 6 },
  bRow:        { display: 'flex', justifyContent: 'space-between' },
  bLabel:      { fontSize: 12, color: '#7a8fa6' },
  bVal:        { fontSize: 12, color: '#c0d0e0', fontWeight: 500 },
  cache:       { fontSize: 11, color: '#7a8fa6', marginTop: 8, textAlign: 'right' },
};
