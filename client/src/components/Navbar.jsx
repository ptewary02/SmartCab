import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Navbar({ minimal = false }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const home = user?.role === 'driver' ? '/driver' : '/';

  return (
    <div style={s.nav}>
      <button onClick={() => navigate(home)} style={s.logo}>
        🚖 <span style={s.logoText}>SmartCab</span>
      </button>

      {!minimal && (
        <div style={s.right}>
          <button onClick={() => navigate('/profile')} style={s.profileBtn}>
            <span style={s.avatar}>{user?.name?.[0]?.toUpperCase()}</span>
            <span style={s.name}>{user?.name?.split(' ')[0]}</span>
          </button>
          <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
        </div>
      )}
    </div>
  );
}

const s = {
  nav:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#1B263B', borderBottom: '1px solid #2a3a50', flexShrink: 0 },
  logo:      { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer' },
  logoText:  { fontSize: 16, fontWeight: 700, color: '#F28C28' },
  right:     { display: 'flex', alignItems: 'center', gap: 8 },
  profileBtn:{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer' },
  avatar:    { width: 28, height: 28, borderRadius: '50%', background: '#F28C28', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#0D1B2A' },
  name:      { fontSize: 13, color: '#c0d0e0', fontWeight: 500 },
  logoutBtn: { fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid #2a3a50', background: 'none', color: '#7a8fa6', cursor: 'pointer' },
};
