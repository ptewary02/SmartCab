import express from 'express';
import {
  requestTrip,
  acceptTrip,
  startTrip,
  completeTrip,
  cancelTrip,
  rateTrip,
  getMyTrips,
} from '../controllers/trip.controller.js';
import { protect }   from '../middleware/auth.middleware.js';
import { authorise } from '../middleware/role.middleware.js';

const router = express.Router();

router.post('/',              protect, authorise('rider'),  requestTrip);
router.patch('/:id/accept',   protect, authorise('driver'), acceptTrip);
router.patch('/:id/start',    protect, authorise('driver'), startTrip);
router.patch('/:id/complete', protect, authorise('driver'), completeTrip);
router.patch('/:id/cancel',   protect, cancelTrip);
router.patch('/:id/rate',     protect, rateTrip);
router.get('/mine',           protect, getMyTrips);

export default router;