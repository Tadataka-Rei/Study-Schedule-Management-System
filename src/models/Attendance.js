const mongoose = require('mongoose');
const { Schema } = mongoose;

const attendanceSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timetableEventId: { type: Schema.Types.ObjectId, ref: 'TimetableEvent', required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'absent' },
  markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Teacher who marked attendance
  markedAt: { type: Date, default: Date.now },
  notes: String
});

// Compound index to ensure one attendance record per student per timetable event
attendanceSchema.index({ studentId: 1, timetableEventId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
