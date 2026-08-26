import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const Field = ({ icon, placeholder, type = "text", value, onChange, disabled, isPassword, showPassword, onToggleShow }) => (
  <div style={{ position: "relative" }}>
    <span className="material-symbols-outlined" style={{ position: "absolute", left: 0, bottom: 8 }}>
      {icon}
    </span>
    <input
      className="underlined-input"
      placeholder={placeholder}
      type={isPassword ? (showPassword ? "text" : "password") : type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={isPassword ? { paddingRight: 28 } : undefined}
      required
    />
    {isPassword && (
      <span
        className="material-symbols-outlined"
        onClick={onToggleShow}
        role="button"
        tabIndex={0}
        aria-label={showPassword ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          right: 0,
          bottom: 6,
          fontSize: 20,
          color: "#45474d",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {showPassword ? "visibility_off" : "visibility"}
      </span>
    )}
  </div>
);

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'driver' ? '/driver' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#051125", marginBottom: 8, marginTop: 0 }}>
        Sign In
      </h2>
      <p style={{ fontSize: 14, color: "#45474d", marginBottom: 32, marginTop: 0 }}>
        Sign in to your SmartCab account
      </p>

      <form onSubmit={handle}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px 32px", marginBottom: 32, marginRight: 14 }}>
          <Field
            icon="mail" placeholder="Email Address" type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={loading}
          />
          <Field
            icon="lock" placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            disabled={loading}
            isPassword
            showPassword={showPassword}
            onToggleShow={() => setShowPassword((s) => !s)}
          />
        </div>

        <div style={{ paddingTop: 16, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-around", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#45474d" }}>
            No account?{' '}
            <Link to="/register" style={{ color: "#051125", fontWeight: 600, textDecoration: "underline" }}>
              Register
            </Link>
          </p>
          <button className="book-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </div>
      </form>
    </>
  );
}