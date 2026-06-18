import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const tokens = {
  primary:            "#051125",
  secondaryContainer: "#fea619",
  onSurface:          "#151c27",
  onSurfaceVariant:   "#45474d",
  surface:            "#f9f9ff",
  outlineVariant:     "#c5c6cd",
  background:         "#f0f3ff",
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .material-symbols-outlined {
    font-family: 'Material Symbols Outlined';
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    font-size: 20px;
    color: rgba(69,71,77,0.5);
    line-height: 1;
    user-select: none;
  }

  .city-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(117,119,125,0.15) 1px, transparent 1px),
      linear-gradient(90deg, rgba(117,119,125,0.15) 1px, transparent 1px);
    background-size: 100px 100px;
    transform: rotateX(45deg);
    transform-origin: center;
  }

  .booking-card {
    background: #ffffff;
    border-radius: 4px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.10);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  @media (min-width: 768px) {
    .booking-card { flex-direction: row; }
    .accent-panel { display: flex !important; }
  }

  /* Shared input / button styles consumed by Login.jsx & Register.jsx */
  .underlined-input {
    border: none;
    border-bottom: 1px solid #e5e7eb;
    background: transparent;
    padding: 8px 8px 8px 32px;
    width: 100%;
    font-size: 16px;
    color: #151c27;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.2s;
  }
  .underlined-input::placeholder { color: rgba(69,71,77,0.4); }
  .underlined-input:focus { outline: none; border-bottom-color: #fea619; }
  .underlined-input:disabled { opacity: 0.5; cursor: not-allowed; }

  .role-btn {
    flex: 1; padding: 10px 16px;
    font-size: 14px; font-weight: 700;
    border: 1.5px solid #e5e7eb; border-radius: 4px;
    cursor: pointer; background: transparent;
    color: rgba(69,71,77,0.8);
    font-family: 'Inter', sans-serif;
    transition: all 0.2s;
  }
  .role-btn:hover { border-color: #051125; color: #051125; }
  .role-btn.active {
    background: #051125; color: #ffffff;
    border-color: #051125;
    box-shadow: 0 2px 8px rgba(5,17,37,0.25);
  }

  .book-btn {
    background: #051125; color: #ffffff;
    font-weight: 700; font-size: 12px;
    letter-spacing: 0.15em; text-transform: uppercase;
    padding: 16px 40px; border: none; cursor: pointer;
    transition: filter 0.2s, transform 0.1s;
    font-family: 'Inter', sans-serif;
  }
  .book-btn:hover:not(:disabled) { filter: brightness(1.4); }
  .book-btn:active:not(:disabled) { transform: scale(0.96); }
  .book-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Outlet wrapper: fixed height so the card never jumps ── */
  .auth-outlet {
    flex: 1;
    padding: 48px;
    position: relative;
    overflow: hidden;
    transition: height 0.38s cubic-bezier(0.22,1,0.36,1);
  }

  /* ── Slide animations ── */
  @keyframes slide-from-right {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slide-from-left {
    from { opacity: 0; transform: translateX(-40px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .page-enter-right { animation: slide-from-right 0.38s cubic-bezier(0.22,1,0.36,1) both; }
  .page-enter-left  { animation: slide-from-left  0.38s cubic-bezier(0.22,1,0.36,1) both; }

`;

export default function AuthLayout() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    if (prevPath.current === location.pathname) return;
    const goingToRegister = location.pathname.includes('register');
    setAnimClass(goingToRegister ? 'page-enter-right' : 'page-enter-left');
    prevPath.current = location.pathname;
    const t = setTimeout(() => setAnimClass(''), 400);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <>
      <style>{globalStyles}</style>

      <div style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: tokens.background,
        color: tokens.onSurface,
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px", overflow: "hidden", position: "relative",
      }}>

        {/* ── Background: grid + glow orbs only, no cabs ── */}
        <div aria-hidden="true" style={{
          position: "fixed", inset: 0, zIndex: 0,
          overflow: "hidden", pointerEvents: "none",
          backgroundColor: tokens.surface, perspective: "1200px",
        }}>
          <div className="city-grid" />
          <div style={{ position:"absolute", top:"-10%", right:"-5%", width:400, height:400, background:"rgba(133,83,0,0.1)", borderRadius:"50%", filter:"blur(120px)" }} />
          <div style={{ position:"absolute", bottom:"-10%", left:"-5%", width:350, height:350, background:"rgba(5,17,37,0.1)", borderRadius:"50%", filter:"blur(100px)" }} />
        </div>

        {/* ── Main content ── */}
        <main style={{ position: "relative", zIndex: 20, width: "100%", maxWidth: 900 }}>

          {/* Brand */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h1 style={{ fontSize:32, lineHeight:"40px", fontWeight:700, letterSpacing:"-0.02em", color:tokens.primary, textShadow:"0 1px 2px rgba(0,0,0,0.08)", margin:0 }}>
              SmartCab
            </h1>
            <p style={{ fontSize:14, fontWeight:500, color:tokens.onSurfaceVariant, letterSpacing:"0.2em", textTransform:"uppercase", marginTop:4 }}>
              Urban Efficiency • Futuristic Speed
            </p>
          </div>

          {/* Card */}
          <div className="booking-card">

            {/* Animated outlet */}
            <div className={`auth-outlet ${animClass}`}>
              <Outlet key={location.pathname} />
            </div>

            {/* Accent panel */}
            <div className="accent-panel" style={{ width:"35%", position:"relative", background:"#fff", alignItems:"center", justifyContent:"center", overflow:"visible", display:"none" }}>
              <div style={{ position:"absolute", left:0, top:0, bottom:0, width:"40%", background:tokens.secondaryContainer }} />
              <div style={{ position:"relative", zIndex:10, width:"100%", marginLeft:-96 }}>
                <img
                  src="./assets/Premium Yellow Cab.png"
                  alt="Premium Yellow Cab"
                  style={{ width:"100%", filter:"drop-shadow(0 20px 30px rgba(0,0,0,0.2))" }}
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div style={{ marginTop:32, display:"flex", alignItems:"center", justifyContent:"center", gap:16, color:"rgba(69,71,77,0.8)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span className="material-symbols-outlined" style={{ fontSize:16, position:"static" }}>shield</span>
              <span style={{ fontSize:12, fontWeight:600, letterSpacing:"-0.02em", textTransform:"uppercase" }}>Secure Link</span>
            </div>
            <div style={{ width:4, height:4, borderRadius:"50%", background:tokens.outlineVariant }} />
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span className="material-symbols-outlined" style={{ fontSize:16, position:"static" }}>language</span>
              <span style={{ fontSize:12, fontWeight:600, letterSpacing:"-0.02em", textTransform:"uppercase" }}>EN-US</span>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}