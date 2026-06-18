/*
  Fare formula:
    base fare:  ₹30
    per km:     ₹12
    per minute: ₹1.5
    surge:      1.0x – 2.5x depending on demand

  Returns fare rounded to nearest rupee.
*/
export const calculateFare = (distanceKm, etaMinutes, surgeMultiplier = 1.0) => {
  const base     = 30;
  const distance = distanceKm  * 12;
  const time     = etaMinutes  * 1.5;
  const raw      = (base + distance + time) * surgeMultiplier;
  return Math.round(raw);
};

// Surge multiplier based on active request count in a zone
export const getSurgeMultiplier = (activeRequests) => {
  if (activeRequests < 5)  return 1.0;
  if (activeRequests < 10) return 1.3;
  if (activeRequests < 20) return 1.7;
  return 2.5;
};