export default function StarRating({ value, onChange, readonly = false }) {
  return (
    <div style={s.wrap}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          style={{
            ...s.star,
            fontSize: star <= value ? 36 : 30,
            opacity:  star <= value ? 1 : 0.3,
            transform: star <= value ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          ⭐
        </button>
      ))}
    </div>
  );
}

const s = {
  wrap: { display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 12 },
  star: { background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.15s', padding: 4 },
};
