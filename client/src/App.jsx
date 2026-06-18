import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Pages
import AuthLayout      from './pages/AuthLayout';
import Login           from './pages/Login';
import Register        from './pages/Register';
import RiderHome       from './pages/rider/RiderHome';
import ConfirmRide     from './pages/rider/ConfirmRide';
import LiveTracking    from './pages/rider/LiveTracking';
import TripSummary     from './pages/rider/TripSummary';
import TripHistory     from './pages/rider/TripHistory';
import DriverHome      from './pages/driver/DriverHome';
import ActiveTrip      from './pages/driver/ActiveTrip';
import EarningsHistory from './pages/driver/EarningsHistory';
import Profile         from './pages/Profile';

const ProtectedRoute = ({ children, role }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'driver' ? '/driver' : '/'} replace />;
  }
  return children;
};

export default function App() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1B263B',
            color: '#fff',
            border: '1px solid #2a3a50',
            borderRadius: '12px',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#F28C28', secondary: '#0D1B2A' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#0D1B2A' } },
        }}
      />
      <Routes>
        {/* Public — AuthLayout is the persistent shell, Login/Register slide inside it */}
        <Route element={!user ? <AuthLayout /> : <Navigate to={user.role === 'driver' ? '/driver' : '/'} />}>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Rider */}
        <Route path="/"         element={<ProtectedRoute role="rider"><RiderHome /></ProtectedRoute>} />
        <Route path="/confirm"  element={<ProtectedRoute role="rider"><ConfirmRide /></ProtectedRoute>} />
        <Route path="/tracking" element={<ProtectedRoute role="rider"><LiveTracking /></ProtectedRoute>} />
        <Route path="/summary"  element={<ProtectedRoute role="rider"><TripSummary /></ProtectedRoute>} />
        <Route path="/history"  element={<ProtectedRoute role="rider"><TripHistory /></ProtectedRoute>} />

        {/* Driver */}
        <Route path="/driver"         element={<ProtectedRoute role="driver"><DriverHome /></ProtectedRoute>} />
        <Route path="/driver/trip"    element={<ProtectedRoute role="driver"><ActiveTrip /></ProtectedRoute>} />
        <Route path="/driver/history" element={<ProtectedRoute role="driver"><EarningsHistory /></ProtectedRoute>} />

        {/* Shared */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? (user.role === 'driver' ? '/driver' : '/') : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}