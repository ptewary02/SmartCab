import jwt    from 'jsonwebtoken';
import User   from '../models/User.js';
import Driver from '../models/Driver.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '15m' });

const signRefresh = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' });

// POST /api/auth/register
export const register = async (req, res) => {
  console.log('BODY:', req.body);
  console.log('MONGO:', process.env.MONGO_URI ? 'connected' : 'MISSING');
  try {
    const { name, email, password, role, licensePlate, vehicleType } = req.body;
    console.log('Step 1 - checking existing user');

    const existing = await User.findOne({ email });
    console.log('Step 2 - existing:', existing);

    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    console.log('Step 3 - creating user');
    const user = await User.create({ name, email, password, role });
    console.log('Step 4 - user created:', user._id);

    if (role === 'driver') {
      console.log('Step 5 - creating driver profile');
      await Driver.create({ userId: user._id, licensePlate, vehicleType: vehicleType || 'mini' });
      console.log('Step 6 - driver profile created');
    }

    console.log('Step 7 - signing tokens');
    const token      = signToken(user._id);
    const refreshTkn = signRefresh(user._id);

    console.log('Step 8 - sending response');
    res.status(201).json({
      success: true, token, refreshToken: refreshTkn,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error('REGISTER ERROR NAME:', err.name);
    console.error('REGISTER ERROR MSG:', err.message);
    console.error('REGISTER ERROR STACK:', err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token      = signToken(user._id);
    const refreshTkn = signRefresh(user._id);

    res.json({ success: true, token, refreshToken: refreshTkn, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/refresh
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const newAccess = signToken(decoded.id);

    res.json({ success: true, token: newAccess });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};