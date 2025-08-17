import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cors from 'cors';
import { PORT, MONGODB_URI } from './config.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173'], credentials: false }));

app.get('/', (_req, res) => res.send('API OK'));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

mongoose.connect(MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch(err => { console.error('Mongo connection error:', err.message); process.exit(1); });
