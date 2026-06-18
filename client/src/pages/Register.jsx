import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const Field = ({ icon, placeholder, type = "text", value, onChange, disabled, children }) => (
  <div style={{ position: "relative" }}>
    <span className="material-symbols-outlined" style={{ position: "absolute", left: 0, bottom: 8, zIndex: 1 }}>
      {icon}
    </span>
    {children ?? (
      <input
        className="underlined-input"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required
      />
    )}
  </div>
);

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [role, setRole]         = useState('rider');
  const [loading, setLoading]   = useState(false);
  const [form, setForm]         = useState({
    name: '', email: '', password: '',
    licensePlate: '', vehicleType: 'mini',
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role };
      if (role === 'driver') {
        payload.licensePlate = form.licensePlate;
        payload.vehicleType  = form.vehicleType;
      }
      const user = await register(payload);
      toast.success(`Welcome, ${user.name.split(' ')[0]}!`);
      navigate(role === 'driver' ? '/driver' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#051125", marginBottom: 8, marginTop: 0 }}>
        Create Account
      </h2>
      <p style={{ fontSize: 14, color: "#45474d", marginBottom: 24, marginTop: 0 }}>
        Join SmartCab as a rider or driver
      </p>

      {/* Role toggle */}
      <div style={{ display: "flex", gap: 12, marginBottom: 30, margin: 14 }}>
        {['rider', 'driver'].map((r) => (
          <button
            key={r} type="button"
            className={`role-btn${role === r ? ' active' : ''}`}
            onClick={() => setRole(r)}
            disabled={loading}
          >
            {r === 'rider' ? ' Rider' : ' Driver'}
          </button>
        ))}
      </div>

      <form onSubmit={handle}>
        <div
          className="fields-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px 32px", marginBottom: 24, marginRight: 14 }}
        >
          <Field icon="person" placeholder="Full Name" type="text"
            value={form.name} onChange={(e) => set('name', e.target.value)} disabled={loading} />
          <Field icon="mail" placeholder="Email Address" type="email"
            value={form.email} onChange={(e) => set('email', e.target.value)} disabled={loading} />
          <Field icon="lock" placeholder="Password" type="password"
            value={form.password} onChange={(e) => set('password', e.target.value)} disabled={loading} />

          {role === 'driver' && (
            <>
              <Field icon="badge" placeholder="License Plate (e.g. UP32AB1234)" type="text"
                value={form.licensePlate}
                onChange={(e) => set('licensePlate', e.target.value.toUpperCase())}
                disabled={loading} />
              <Field icon="directions_car" disabled={loading}>
                <select
                  className="underlined-input"
                  value={form.vehicleType}
                  onChange={(e) => set('vehicleType', e.target.value)}
                  disabled={loading} required
                  style={{ appearance: "none", cursor: "pointer" }}
                >
                  {['bike', 'auto', 'mini', 'sedan', 'suv'].map((v) => (
                    <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                  ))}
                </select>
              </Field>
            </>
          )}
        </div>

        <div style={{ paddingTop: 16, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-around", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#45474d" }}>
            Have an account?{' '}
            <Link to="/login" style={{ color: "#051125", fontWeight: 600, textDecoration: "underline" }}>
              Sign in
            </Link>
          </p>
          <button className="book-btn" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </div>
      </form>
    </>
  );
}