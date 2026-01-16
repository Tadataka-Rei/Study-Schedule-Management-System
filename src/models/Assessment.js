const mongoose = require('mongoose');
const { Schema } = mongoose;

const assessmentSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  sectionId: String,
  semesterId: { type: Schema.Types.ObjectId, ref: 'Semester' },
  type: { type: String, enum: ['assignment', 'quiz', 'midterm', 'final'] },
  title: String,
  weight: Number, // e.g., 0.2 for 20%
  deadlineAt: Date,
  submissionPolicy: { lateAllowed: Boolean, latePenalty: Number }
});

assessmentSchema.index({ courseId: 1, type: 1 });
assessmentSchema.index({ deadlineAt: 1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
