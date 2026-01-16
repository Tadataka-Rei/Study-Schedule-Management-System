const mongoose = require('mongoose');
const { Schema } = mongoose;

const registrationSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User' },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  sectionId: String,
  semesterId: { type: Schema.Types.ObjectId, ref: 'Semester' },
  action: { type: String, enum: ['add', 'drop'] },
  status: { type: String, enum: ['pending', 'approved', 'rejected'] },
  reason: { type: String }, // e.g., "conflict", "capacity"
  requestedAt: { type: Date, default: Date.now },
  decidedAt: Date
});

registrationSchema.index({ studentId: 1, semesterId: 1 });
registrationSchema.index({ courseId: 1, sectionId: 1, semesterId: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
