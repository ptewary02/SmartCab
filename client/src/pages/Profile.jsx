import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div style={s.wrap}>
      <Navbar />
      <div style={s.inner}>
        <div style={s.avatar}>{user?.name?.[0]?.toUpperCase() || '?'}</div>
        <h2 style={s.name}>{user?.name}</h2>
        <span style={s.role}>{user?.role}</span>

        <div style={s.card}>
          {[
            { label: 'Email',  val: user?.email },
            { label: 'Role',   val: user?.role },
            { label: 'Rating', val: `${user?.rating?.toFixed(1) || '5.0'} ⭐` },
          ].map(({ label, val }) => (
            <div key={label} style={s.row}>
              <span style={s.key}>{label}</span>
              <span style={s.val}>{val}</span>
            </div>
          ))}
        </div>

        <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
      </div>
    </div>
  );
}

const s = {
  wrap:      { minHeight: '100vh', background: '#0D1B2A' },
  inner:     { padding: '1.5rem 1rem', maxWidth: 430, margin: '0 auto', textAlign: 'center' },
  avatar:    { width: 80, height: 80, borderRadius: '50%', background: '#F28C28', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: '#0D1B2A', margin: '0 auto 1rem' },
  name:      { fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 8px' },
  role:      { display: 'inline-block', fontSize: 12, padding: '4px 12px', borderRadius: 99, background: '#F28C2822', color: '#F28C28', fontWeight: 600, textTransform: 'capitalize', marginBottom: '1.5rem' },
  card:      { background: '#1B263B', borderRadius: 14, padding: '1rem', border: '1px solid #2a3a50', textAlign: 'left', marginBottom: '1.5rem' },
  row:       { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #2a3a50' },
  key:       { fontSize: 13, color: '#7a8fa6' },
  val:       { fontSize: 13, color: '#fff', fontWeight: 500 },
  logoutBtn: { width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#ef444422', color: '#ef4444', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
};
