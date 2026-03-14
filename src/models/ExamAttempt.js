const mongoose = require('mongoose');

const detailSchema = new mongoose.Schema(
  {
    questionKey: { type: String, required: true },
    prompt: { type: String, required: true },
    type: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    userAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
    correctAnswer: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { _id: false }
);

const examAttemptSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    examTitle: { type: String, required: true, trim: true },
    participantName: { type: String, default: 'Hoc sinh', trim: true },
    submittedAnswers: { type: mongoose.Schema.Types.Mixed, default: {} },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    correctCount: { type: Number, required: true },
    wrongCount: { type: Number, required: true },
    details: { type: [detailSchema], default: [] }
  },
  { timestamps: true }
);

examAttemptSchema.index({ createdAt: -1 });
examAttemptSchema.index({ examId: 1, createdAt: -1 });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);