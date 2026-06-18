import express    from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors       from 'cors';
import helmet     from 'helmet';
import morgan     from 'morgan';
import dotenv     from 'dotenv';
import connectDB  from './config/db.js';
import redis      from './config/redis.js';
import { initSocket }  from './socket/socket.handler.js';
import { setIO }       from './controllers/trip.controller.js';
import { setQueueIO }  from './queue/tripQueue.js';

import authRoutes   from './routes/auth.routes.js';
import driverRoutes from './routes/driver.routes.js';
import tripRoutes   from './routes/trip.routes.js';
import routeRoutes  from './routes/route.routes.js';

dotenv.config();
connectDB();
// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', message: 'SmartCab backend is live' }));

const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' },
  pingTimeout:  60000,
  pingInterval: 25000,
});

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth',    authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips',   tripRoutes);
app.use('/api/route',   routeRoutes);

// Pass io instance to controllers and queue
// so they can emit socket events after DB operations
initSocket(io);
setIO(io);
setQueueIO(io);

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.once('SIGUSR2', async () => {
  await redis.quit();
  process.kill(process.pid, 'SIGUSR2');
});

process.on('SIGINT', async () => {
  await redis.quit();
  process.exit(0);
});