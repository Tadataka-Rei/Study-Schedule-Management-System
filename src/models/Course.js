const mongoose = require('mongoose');
const { Schema } = mongoose;

const courseSchema = new Schema({
  code: { type: String, unique: true, required: true },
  name: String,
  credits: Number,
  ownerLecturerId: { type: Schema.Types.ObjectId, ref: 'User' },
  semesterId: { type: Schema.Types.ObjectId, ref: 'Semester' },
  sections: [{
    sectionId: String,
    lecturerId: { type: Schema.Types.ObjectId, ref: 'User' },
    capacity: Number,
    enrolledCount: { type: Number, default: 0 }
  }],
  scheduleTemplate: [{
    dayOfWeek: Number,  // [1, 3] for Mon & Wed
    startTime: String,  // ["08:00", "13:00"]
    endTime: String,    // ["09:30", "14:30"]
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' }
  }],
  policies: {
    addDropDeadline: Date,
    attendanceWeight: Number,
    gradingSchema: Object
  }
});

courseSchema.index({ semesterId: 1 });
courseSchema.index({ 'sections.lecturerId': 1 });

module.exports = mongoose.model('Course', courseSchema);
