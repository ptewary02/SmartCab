import express from 'express';
import {
  createDriverProfile,
  getNearbyDrivers,
  toggleAvailability,
  getDriverProfile,
} from '../controllers/driver.controller.js';
import { protect }    from '../middleware/auth.middleware.js';
import { authorise }  from '../middleware/role.middleware.js';

const router = express.Router();

// Any logged-in driver can create/view their profile
router.post('/',         protect, authorise('driver'), createDriverProfile);
router.get('/me',        protect, authorise('driver'), getDriverProfile);
router.patch('/toggle',  protect, authorise('driver'), toggleAvailability);

// Riders use this to find nearby drivers
router.get('/nearby',    protect, authorise('rider'),  getNearbyDrivers);

export default router;