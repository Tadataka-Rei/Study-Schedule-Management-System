const mongoose = require('mongoose');
const { Schema } = mongoose;

const semesterSchema = new Schema({
  name: { type: String, unique: true, required: true }, // e.g., "2025–2026 HK1"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  registrationWindows: {
    addStart: Date, addEnd: Date,
    dropStart: Date, dropEnd: Date
  }
});

semesterSchema.index({ startDate: 1 });

module.exports = mongoose.model('Semester', semesterSchema);
