import express from 'express';
import { z } from 'zod';
import Task from '../models/Task.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { ApiError } from '../middleware/error-handler.js';

const router = express.Router();
router.use(requireAuth);

const taskIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid task id')
});

const createTaskBodySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long')
});

const updateTaskBodySchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(200, 'Title is too long').optional(),
  completed: z.boolean().optional()
}).refine((data) => data.title !== undefined || data.completed !== undefined, {
  message: 'Provide at least one field to update'
});

router.get('/', asyncHandler(async (req, res) => {
  const tasks = await Task.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(tasks);
}));

router.post('/', validate(createTaskBodySchema), asyncHandler(async (req, res) => {
  const { title } = req.body;
  const task = await Task.create({ user: req.userId, title });
  res.status(201).json(task);
}));

router.patch('/:id', validate(taskIdParamsSchema, 'params'), validate(updateTaskBodySchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const update = {};
  if (req.body.title !== undefined) update.title = req.body.title;
  if (req.body.completed !== undefined) update.completed = req.body.completed;
  const task = await Task.findOneAndUpdate({ _id: id, user: req.userId }, update, { new: true });
  if (!task) throw new ApiError(404, 'TASK_NOT_FOUND', 'Task not found');
  res.json(task);
}));

router.delete('/:id', validate(taskIdParamsSchema, 'params'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await Task.findOneAndDelete({ _id: id, user: req.userId });
  if (!task) throw new ApiError(404, 'TASK_NOT_FOUND', 'Task not found');
  res.json({ ok: true });
}));

export default router;
