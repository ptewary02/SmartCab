import { useEffect, useRef, useState } from 'react';
import useSocket from './useSocket';

const useDriverLocation = (isOnline) => {
  const socket = useSocket();
  const [location, setLocation] = useState(null);
  const [error, setError]       = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const watchRef    = useRef(null);
  const intervalRef = useRef(null);
  const latestRef   = useRef(null);

  useEffect(() => {
    if (!isOnline || !socket) { stop(); return; }
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    start();
    return stop;
  }, [isOnline, socket]);

  const start = () => {
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        latestRef.current = coords;
        setLocation(coords);
        setAccuracy(pos.coords.accuracy);
        setError(null);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    intervalRef.current = setInterval(() => {
      if (socket?.connected && latestRef.current) {
        socket.emit('driver:updateLocation', latestRef.current);
      }
    }, 3000);
  };

  const stop = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (socket?.connected) socket.emit('driver:goOffline');
  };

  return { location, error, accuracy };
};

export default useDriverLocation;
