import express from 'express';
import Task from '../models/Task.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const tasks = await Task.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(tasks);
});

router.post('/', async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Title required' });
  const task = await Task.create({ user: req.userId, title });
  res.status(201).json(task);
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const update = {};
  if (req.body.title !== undefined) update.title = req.body.title;
  if (req.body.completed !== undefined) update.completed = req.body.completed;
  const task = await Task.findOneAndUpdate({ _id: id, user: req.userId }, update, { new: true });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const task = await Task.findOneAndDelete({ _id: id, user: req.userId });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json({ ok: true });
});

export default router;
