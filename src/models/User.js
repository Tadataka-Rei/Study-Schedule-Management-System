const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  role: { type: String, enum: ['student', 'lecturer', 'admin'], required: true },
  password: { type: String, required: true },
  profile: {
    fullName: String,
    email: { type: String, unique: true, required: true },
    phone: String,
    studentId: String, // index if role is student
    lecturerId: String // index if role is lecturer
  },
  settings: {
    timezone: { type: String, default: 'UTC' },
    locale: { type: String, default: 'en' },
    notificationPrefs: { email: Boolean, push: Boolean }
  },
  enrollments: [{
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester' },
    status: String,
    addDropHistory: [Object]
  }]
});

userSchema.index({ role: 1 });
userSchema.index({ 'enrollments.courseId': 1 });
userSchema.index({ 'profile.studentId': 1 });
userSchema.index({ 'profile.lecturerId': 1 });

module.exports = mongoose.model('User', userSchema);
