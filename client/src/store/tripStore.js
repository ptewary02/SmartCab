import { create } from 'zustand';

const useTripStore = create((set) => ({
  currentTrip:    null,
  route:          null,
  driverLocation: null,
  tripStatus:     null,
  assignedDriver: null,

  setTrip:           (trip)     => set({ currentTrip: trip, tripStatus: trip?.status }),
  setRoute:          (route)    => set({ route }),
  setDriverLocation: (loc)      => set({ driverLocation: loc }),
  setTripStatus:     (status)   => set({ tripStatus: status }),
  setAssignedDriver: (driver)   => set({ assignedDriver: driver }),

  clearTrip: () => set({
    currentTrip:    null,
    route:          null,
    driverLocation: null,
    tripStatus:     null,
    assignedDriver: null,
  }),
}));

export default useTripStore;
