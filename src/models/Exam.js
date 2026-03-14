const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, default: 15 },
    heroEmoji: { type: String, default: '📘' },
    isPublished: { type: Boolean, default: true, index: true },
    questionCount: { type: Number, default: 0 },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

examSchema.index({ slug: 1, isPublished: 1 });
examSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Exam', examSchema);