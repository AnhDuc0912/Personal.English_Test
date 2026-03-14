const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const dragItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const dragTargetSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    correctItemKey: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['single-choice', 'multiple-choice', 'fill-blank', 'drag-drop']
    },
    prompt: { type: String, required: true, trim: true },
    instructions: { type: String, default: '', trim: true },
    imageUrl: { type: String, default: '', trim: true },
    options: { type: [optionSchema], default: [] },
    correctAnswers: { type: [String], default: [] },
    acceptedAnswers: { type: [String], default: [] },
    dragItems: { type: [dragItemSchema], default: [] },
    dragTargets: { type: [dragTargetSchema], default: [] },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

questionSchema.index({ type: 1 });
questionSchema.index({ key: 1 });

module.exports = mongoose.model('Question', questionSchema);
