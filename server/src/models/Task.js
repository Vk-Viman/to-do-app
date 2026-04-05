import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  dueDate: { type: Date, default: null },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  labels: { type: [String], default: [] }
}, { timestamps: true });

taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, completed: 1, createdAt: -1 });
taskSchema.index({ user: 1, dueDate: 1 });

export default mongoose.model('Task', taskSchema);
