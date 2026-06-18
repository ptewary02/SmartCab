const STATES = ['requested', 'accepted', 'ongoing', 'completed'];
const LABELS  = { requested: 'Finding Driver', accepted: 'Driver Coming', ongoing: 'On the Way', completed: 'Arrived' };
const COLORS  = { requested: '#F28C28', accepted: '#3b82f6', ongoing: '#8b5cf6', completed: '#22c55e', cancelled: '#ef4444' };

export default function TripStatusBar({ status }) {
  if (!status) return null;

  if (status === 'cancelled') {
    return (
      <div style={s.cancelled}>
        <span>❌</span>
        <p style={s.cancelText}>Trip Cancelled</p>
      </div>
    );
  }

  const currentIdx = STATES.indexOf(status);

  return (
    <div style={s.wrap}>
      {STATES.map((state, i) => {
        const done    = i < currentIdx;
        const active  = i === currentIdx;
        const color   = active ? COLORS[state] : done ? '#22c55e' : '#2a3a50';
        return (
          <div key={state} style={s.step}>
            <div style={{ ...s.dot, background: color, boxShadow: active ? `0 0 8px ${color}` : 'none' }}>
              {done ? '✓' : i + 1}
            </div>
            {i < STATES.length - 1 && (
              <div style={{ ...s.line, background: done ? '#22c55e' : '#2a3a50' }} />
            )}
            <p style={{ ...s.stepLabel, color: active ? color : done ? '#22c55e' : '#7a8fa6' }}>
              {LABELS[state]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

const s = {
  wrap:       { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 0', marginBottom: 12, position: 'relative' },
  step:       { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' },
  dot:        { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', transition: 'all 0.3s', zIndex: 1 },
  line:       { position: 'absolute', top: 14, left: '50%', width: '100%', height: 2, transition: 'background 0.3s' },
  stepLabel:  { fontSize: 10, marginTop: 6, textAlign: 'center', fontWeight: 500, transition: 'color 0.3s' },
  cancelled:  { display: 'flex', alignItems: 'center', gap: 8, background: '#ef444422', borderRadius: 10, padding: '10px 14px', marginBottom: 12 },
  cancelText: { fontSize: 14, fontWeight: 600, color: '#ef4444', margin: 0 },
};
