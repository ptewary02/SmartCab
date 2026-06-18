import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import useTripStore from '../../store/tripStore';
import useAuthStore from '../../store/authStore';

const MAP_LIBS = ['places'];
const DEFAULT_CENTER = { lat: 26.7606, lng: 83.3732 };

export default function RiderHome() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { setRoute, setTrip } = useTripStore();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
    libraries: MAP_LIBS,
  });

  const [map, setMap]               = useState(null);
  const [mapLoaded, setMapLoaded]   = useState(false);
  const [pickup, setPickup]         = useState(DEFAULT_CENTER);
  const [pickupAddr, setPickupAddr] = useState('Railway Station, Gorakhpur');
  const [destination, setDest]      = useState(null);
  const [destAddr, setDestAddr]     = useState('');
  const [route, setRouteLocal]      = useState(null);
  const [booking, setBooking]       = useState(false);
  const [fetching, setFetching]     = useState(false);

  const onMapLoad = useCallback((m) => { setMap(m); setMapLoaded(true); }, []);

  const onMapClick = async (e) => {
    const lat  = e.latLng.lat();
    const lng  = e.latLng.lng();
    const addr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    setDest({ lat, lng });
    setDestAddr(addr);
    await fetchRoute({ lat, lng });
  };

  const getMyLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    toast('Getting your location...', { icon: '📍' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPickup(coords);
        setPickupAddr('My Current Location');
        map?.panTo(coords);
        map?.setZoom(15);
      },
      () => toast.error('Could not get location')
    );
  };

  const fetchRoute = async (dest) => {
    setFetching(true);
    try {
      const { data } = await api.post('/route', {
        pickup:      { lat: pickup.lat, lng: pickup.lng },
        destination: { lat: dest.lat,  lng: dest.lng  },
      });
      setRouteLocal(data.route);
      setRoute(data.route);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Route not found — try a closer point');
    } finally {
      setFetching(false);
    }
  };

  const bookRide = async () => {
    if (!destination) return toast.error('Please select a destination on the map');
    setBooking(true);
    try {
      const { data } = await api.post('/trips', {
        pickup:      { ...pickup,      address: pickupAddr },
        destination: { ...destination, address: destAddr  },
      });
      setTrip(data.trip);
      toast.success('Ride requested! Finding your driver...');
      navigate('/tracking');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div style={s.page}>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <div style={s.brand}>
            <span style={s.brandIcon}>🚖</span>
            <span style={s.brandName}>SmartCab</span>
          </div>
          <div style={s.navLinks}>
            <button style={s.navLink}>Ride</button>
            <button style={s.navLink} onClick={() => navigate('/history')}>History</button>
            <button style={s.navLink} onClick={() => navigate('/profile')}>Profile</button>
          </div>
        </div>
        <div style={s.navRight}>
          <span style={s.navGreet}>Hey, {user?.name?.split(' ')[0]} 👋</span>
          <button onClick={() => navigate('/profile')} style={s.navAvatar}>
            {user?.name?.[0]?.toUpperCase()}
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} style={s.navLogout}>
            Log out
          </button>
        </div>
      </nav>

      {/* ── MAIN ────────────────────────────────────────────────── */}
      <div style={s.main}>

        {/* LEFT SIDE */}
        <div style={s.left}>
          <div style={s.leftScroll}>

            <p style={s.city}>📍 Gorakhpur, Uttar Pradesh</p>
            <h1 style={s.headline}>Request a ride for<br />now or later</h1>

            {/* Tech promo tag */}
            <div style={s.promoRow}>
              <span style={s.promoTag}>🏷️</span>
              <p style={s.promoText}>
                <strong style={{ color: '#fff' }}>Powered by Dijkstra's algorithm</strong>
                {' '}— fastest route, every time.{' '}
                <span style={s.promoMuted}>Real-time driver matching via geohash + min-heap.</span>
              </p>
            </div>

            {/* Schedule pill */}
            <div style={s.schedRow}>
              <button style={s.schedPill}>⏱&nbsp; Pickup now &nbsp;▾</button>
            </div>

            {/* Input card */}
            <div style={s.inputCard}>

              {/* Pickup row */}
              <div style={s.inputRow}>
                <div style={s.dotPickup} />
                <input
                  style={s.textInput}
                  placeholder="Pickup location"
                  value={pickupAddr}
                  onChange={(e) => setPickupAddr(e.target.value)}
                />
                <button onClick={getMyLocation} style={s.gpsBtn} title="Use GPS">➤</button>
              </div>

              {/* Connector line */}
              <div style={s.connector}>
                <div style={s.connLine} />
              </div>

              {/* Dropoff row */}
              <div style={s.inputRow}>
                <div style={s.dotDest} />
                <input
                  style={s.textInput}
                  placeholder="Dropoff location (tap map →)"
                  value={destAddr}
                  readOnly
                />
              </div>
            </div>

            {/* Route loading */}
            {fetching && (
              <div style={s.loadRow}>
                <div style={s.spinner} />
                <span style={s.loadText}>Finding fastest route...</span>
              </div>
            )}

            {/* Route stats */}
            {route && !fetching && (
              <div style={s.statsCard}>
                <div style={s.stat}>
                  <p style={s.statVal}>{route.distanceKm} km</p>
                  <p style={s.statKey}>Distance</p>
                </div>
                <div style={s.statDivider} />
                <div style={s.stat}>
                  <p style={s.statVal}>{route.etaMinutes} min</p>
                  <p style={s.statKey}>ETA</p>
                </div>
                <div style={s.statDivider} />
                <div style={s.stat}>
                  <p style={{ ...s.statVal, color: '#F28C28' }}>₹{route.fareEstimate}</p>
                  <p style={s.statKey}>Fare est.</p>
                </div>
                {route.surgeMultiplier > 1 && (
                  <span style={s.surge}>⚡ {route.surgeMultiplier}x</span>
                )}
              </div>
            )}

            {/* Book button */}
            <button
              onClick={bookRide}
              disabled={booking || !destination}
              style={{
                ...s.cta,
                opacity:  (!destination || booking) ? 0.45 : 1,
                cursor:   (!destination || booking) ? 'not-allowed' : 'pointer',
              }}
            >
              {booking ? 'Booking...' : route ? `Book Ride — ₹${route.fareEstimate}` : 'See prices'}
            </button>

            <p style={s.hint}>
              {destination
                ? '✅ Destination selected — ready to book!'
                : '👉 Tap anywhere on the map to set your destination'}
            </p>

            <button onClick={() => navigate('/history')} style={s.ghostLink}>
              View trip history →
            </button>

          </div>
        </div>

        {/* RIGHT SIDE — MAP */}
        <div style={s.right}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={pickup}
              zoom={14}
              onLoad={onMapLoad}
              onClick={onMapClick}
              options={{
                styles:               DARK_MAP,
                disableDefaultUI:     false,
                zoomControl:          true,
                streetViewControl:    false,
                mapTypeControl:       false,
                fullscreenControl:    false,
              }}
            >
              {/* Pickup pin */}
              <Marker position={pickup} icon={PIN('#F28C28')} />

              {/* Destination pin */}
              {destination && <Marker position={destination} icon={PIN('#ef4444')} />}

              {/* Straight-line route preview */}
              {destination && (
                <Polyline
                  path={[pickup, destination]}
                  options={{
                    strokeColor:   '#F28C28',
                    strokeOpacity: 0.85,
                    strokeWeight:  4,
                    icons: [{
                      icon:   { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
                      offset: '0',
                      repeat: '18px',
                    }],
                  }}
                />
              )}
            </GoogleMap>
          ) : (
            <div style={s.mapLoading}>
              <div style={s.bigSpinner} />
              <p style={s.mapLoadText}>Loading map...</p>
            </div>
          )}

          {/* Floating hint badge */}
          {mapLoaded && !destination && (
            <div style={s.floatBadge}>🗺️ Tap the map to set your destination</div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ── Custom SVG pin ───────────────────────────────────────────── */
const PIN = (color) => ({
  path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  fillColor:    color,
  fillOpacity:  1,
  strokeColor:  '#fff',
  strokeWeight: 2,
  scale:        1.9,
  anchor:       { x: 12, y: 22 },
});

/* ── Styles ───────────────────────────────────────────────────── */
const s = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D1B2A', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },

  // Nav
  nav:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 60, padding: '0 28px', background: '#0D1B2A', borderBottom: '1px solid #1B263B', flexShrink: 0, zIndex: 10 },
  navLeft:   { display: 'flex', alignItems: 'center', gap: 28 },
  brand:     { display: 'flex', alignItems: 'center', gap: 8 },
  brandIcon: { fontSize: 22 },
  brandName: { fontSize: 18, fontWeight: 800, color: '#F28C28', letterSpacing: '-0.3px' },
  navLinks:  { display: 'flex', gap: 4 },
  navLink:   { background: 'none', border: 'none', color: '#c0d0e0', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '6px 14px', borderRadius: 8 },
  navRight:  { display: 'flex', alignItems: 'center', gap: 10 },
  navGreet:  { fontSize: 13, color: '#7a8fa6' },
  navAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#F28C28', border: 'none', color: '#0D1B2A', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  navLogout: { padding: '7px 16px', borderRadius: 99, border: '1.5px solid #2a3a50', background: 'none', color: '#c0d0e0', fontSize: 13, fontWeight: 500, cursor: 'pointer' },

  // Main
  main:  { display: 'flex', flex: 1, overflow: 'hidden' },

  // Left
  left:       { width: 460, flexShrink: 0, overflowY: 'auto', background: '#0D1B2A', borderRight: '1px solid #1B263B' },
  leftScroll: { padding: '36px 36px 32px' },

  city:     { fontSize: 13, color: '#7a8fa6', marginBottom: 10 },
  headline: { fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 20, letterSpacing: '-0.5px' },

  // Promo
  promoRow:  { display: 'flex', gap: 10, background: '#1B263B', borderRadius: 12, padding: '11px 14px', marginBottom: 18, border: '1px solid #2a3a50', alignItems: 'flex-start' },
  promoTag:  { fontSize: 16, flexShrink: 0, marginTop: 1 },
  promoText: { fontSize: 13, color: '#a0b0c0', margin: 0, lineHeight: 1.5 },
  promoMuted:{ color: '#7a8fa6' },

  // Schedule
  schedRow: { marginBottom: 14 },
  schedPill:{ padding: '8px 16px', borderRadius: 99, border: '1.5px solid #2a3a50', background: '#1B263B', color: '#c0d0e0', fontSize: 14, fontWeight: 500, cursor: 'pointer' },

  // Input card — matches Uber's stacked input style
  inputCard: { background: '#1B263B', borderRadius: 14, border: '1px solid #2a3a50', overflow: 'hidden', marginBottom: 14 },
  inputRow:  { display: 'flex', alignItems: 'center', gap: 10, padding: '4px 14px' },
  dotPickup: { width: 10, height: 10, borderRadius: '50%', background: '#F28C28', flexShrink: 0 },
  dotDest:   { width: 10, height: 10, borderRadius: 2, background: '#ef4444', flexShrink: 0 },
  textInput: { flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 15, padding: '13px 0', caretColor: '#F28C28' },
  gpsBtn:    { background: 'none', border: 'none', color: '#F28C28', fontSize: 17, cursor: 'pointer', padding: '4px 6px', flexShrink: 0 },
  connector: { padding: '0 14px' },
  connLine:  { height: 1, background: '#2a3a50', marginLeft: 20 },

  // Loading
  loadRow:  { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  spinner:  { width: 16, height: 16, border: '2px solid #2a3a50', borderTop: '2px solid #F28C28', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 },
  loadText: { fontSize: 13, color: '#7a8fa6' },

  // Stats
  statsCard:  { display: 'flex', alignItems: 'center', background: '#1B263B', borderRadius: 12, border: '1px solid #2a3a50', padding: '12px 16px', marginBottom: 14, gap: 4 },
  stat:       { flex: 1, textAlign: 'center' },
  statVal:    { fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 2px' },
  statKey:    { fontSize: 11, color: '#7a8fa6', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' },
  statDivider:{ width: 1, height: 32, background: '#2a3a50', flexShrink: 0 },
  surge:      { fontSize: 11, padding: '3px 8px', borderRadius: 99, background: '#ef444422', color: '#ef4444', fontWeight: 700, flexShrink: 0, marginLeft: 4 },

  // CTA — matches Uber's black button
  cta: { display: 'block', width: '100%', padding: '15px', borderRadius: 12, border: 'none', background: '#F28C28', color: '#0D1B2A', fontSize: 16, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.2px', transition: 'opacity 0.15s' },
  hint:     { fontSize: 12, color: '#7a8fa6', textAlign: 'center', marginBottom: 14 },
  ghostLink:{ background: 'none', border: 'none', color: '#7a8fa6', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 },

  // Right / Map
  right:       { flex: 1, position: 'relative', overflow: 'hidden' },
  mapLoading:  { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1B263B', gap: 14 },
  bigSpinner:  { width: 44, height: 44, border: '3px solid #2a3a50', borderTop: '3px solid #F28C28', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  mapLoadText: { fontSize: 14, color: '#7a8fa6' },
  floatBadge:  { position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(13,27,42,0.88)', backdropFilter: 'blur(8px)', border: '1px solid #2a3a50', borderRadius: 99, padding: '9px 20px', fontSize: 13, color: '#c0d0e0', whiteSpace: 'nowrap', pointerEvents: 'none' },
};

/* ── Dark Google Maps style ───────────────────────────────────── */
const DARK_MAP = [
  { elementType: 'geometry',           stylers: [{ color: '#0D1B2A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0D1B2A' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#7a8fa6' }] },
  { featureType: 'administrative',     elementType: 'geometry.stroke',    stylers: [{ color: '#1B263B' }] },
  { featureType: 'poi',                elementType: 'geometry',           stylers: [{ color: '#1B263B' }] },
  { featureType: 'poi.park',           elementType: 'geometry',           stylers: [{ color: '#0f2d1a' }] },
  { featureType: 'road',               elementType: 'geometry',           stylers: [{ color: '#1B263B' }] },
  { featureType: 'road',               elementType: 'geometry.stroke',    stylers: [{ color: '#2a3a50' }] },
  { featureType: 'road',               elementType: 'labels.text.fill',   stylers: [{ color: '#9ca3af' }] },
  { featureType: 'road.highway',       elementType: 'geometry',           stylers: [{ color: '#243447' }] },
  { featureType: 'road.highway',       elementType: 'geometry.stroke',    stylers: [{ color: '#1B263B' }] },
  { featureType: 'road.highway',       elementType: 'labels.text.fill',   stylers: [{ color: '#c0d0e0' }] },
  { featureType: 'transit',            elementType: 'geometry',           stylers: [{ color: '#1B263B' }] },
  { featureType: 'water',              elementType: 'geometry',           stylers: [{ color: '#003366' }] },
  { featureType: 'water',              elementType: 'labels.text.fill',   stylers: [{ color: '#4a7fa5' }] },
];
