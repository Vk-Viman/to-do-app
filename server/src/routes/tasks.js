import express from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
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

const taskQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['all', 'open', 'completed']).default('all'),
  search: z.string().trim().max(100).default(''),
  sort: z.enum(['newest', 'oldest', 'dueSoon', 'dueLate', 'priorityHigh', 'priorityLow', 'alpha']).default('newest')
});

const dueDateSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed;
}, z.date().nullable());

const labelsSchema = z.array(z.string().trim().min(1).max(24)).max(10)
  .transform((labels) => [...new Set(labels.map((label) => label.toLowerCase()))]);

const createTaskBodySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  dueDate: dueDateSchema.optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  labels: labelsSchema.optional()
});

const updateTaskBodySchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(200, 'Title is too long').optional(),
  completed: z.boolean().optional(),
  dueDate: dueDateSchema.optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  labels: labelsSchema.optional()
}).refine((data) =>
  data.title !== undefined ||
  data.completed !== undefined ||
  data.dueDate !== undefined ||
  data.priority !== undefined ||
  data.labels !== undefined
, {
  message: 'Provide at least one field to update'
});

function resolveSort(sort) {
  switch (sort) {
    case 'oldest':
      return { createdAt: 1 };
    case 'dueSoon':
      return { dueDate: 1, createdAt: -1 };
    case 'dueLate':
      return { dueDate: -1, createdAt: -1 };
    case 'alpha':
      return { title: 1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
}

router.get('/', validate(taskQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const { page, limit, status, search, sort } = req.query;
  const filter = { user: req.userId };

  if (status === 'open') filter.completed = false;
  if (status === 'completed') filter.completed = true;

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { title: regex },
      { labels: regex }
    ];
  }

  const skip = (page - 1) * limit;
  const total = await Task.countDocuments(filter);

  if (sort === 'priorityHigh' || sort === 'priorityLow') {
    const userObjectId = new mongoose.Types.ObjectId(req.userId);
    const aggregationFilter = { ...filter, user: userObjectId };
    const priorityWeight = sort === 'priorityHigh'
      ? {
          $switch: {
            branches: [
              { case: { $eq: ['$priority', 'high'] }, then: 3 },
              { case: { $eq: ['$priority', 'medium'] }, then: 2 },
              { case: { $eq: ['$priority', 'low'] }, then: 1 }
            ],
            default: 0
          }
        }
      : {
          $switch: {
            branches: [
              { case: { $eq: ['$priority', 'low'] }, then: 1 },
              { case: { $eq: ['$priority', 'medium'] }, then: 2 },
              { case: { $eq: ['$priority', 'high'] }, then: 3 }
            ],
            default: 9
          }
        };

    const items = await Task.aggregate([
      { $match: aggregationFilter },
      { $addFields: { priorityWeight } },
      { $sort: { priorityWeight: sort === 'priorityHigh' ? -1 : 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    return res.json({
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: skip + items.length < total,
        hasPrevPage: page > 1
      }
    });
  }

  const items = await Task.find(filter)
    .sort(resolveSort(sort))
    .skip(skip)
    .limit(limit);

  res.json({
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: skip + items.length < total,
      hasPrevPage: page > 1
    }
  });
}));

router.post('/', validate(createTaskBodySchema), asyncHandler(async (req, res) => {
  const { title, dueDate, priority, labels } = req.body;
  const task = await Task.create({ user: req.userId, title, dueDate, priority, labels });
  res.status(201).json(task);
}));

router.patch('/:id', validate(taskIdParamsSchema, 'params'), validate(updateTaskBodySchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const update = {};
  if (req.body.title !== undefined) update.title = req.body.title;
  if (req.body.completed !== undefined) update.completed = req.body.completed;
  if (req.body.dueDate !== undefined) update.dueDate = req.body.dueDate;
  if (req.body.priority !== undefined) update.priority = req.body.priority;
  if (req.body.labels !== undefined) update.labels = req.body.labels;
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
