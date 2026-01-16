const mongoose = require('mongoose');
const { Schema } = mongoose;

const timetableEventSchema = new Schema({
  type: { type: String, enum: ['class', 'exam', 'makeup', 'deadline'] },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  sectionId: String,
  semesterId: { type: Schema.Types.ObjectId, ref: 'Semester' },
  startAt: Date,
  endAt: Date,
  roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
  status: { type: String, default: 'scheduled' },
  meta: { topic: String, notes: String, createdBy: Schema.Types.ObjectId }
});

timetableEventSchema.index({ semesterId: 1, startAt: 1 });
timetableEventSchema.index({ courseId: 1, startAt: 1 });
timetableEventSchema.index({ roomId: 1, startAt: 1 });
timetableEventSchema.index({ type: 1 });

module.exports = mongoose.model('TimetableEvent', timetableEventSchema);
