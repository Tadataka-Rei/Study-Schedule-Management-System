const mongoose = require('mongoose');
const { Schema } = mongoose;

const submissionSchema = new Schema({
  assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment' },
  studentId: { type: Schema.Types.ObjectId, ref: 'User' },
  submittedAt: { type: Date, default: Date.now },
  files: [{ url: String, name: String }],
  grade: {
    score: Number,
    graderId: { type: Schema.Types.ObjectId, ref: 'User' },
    gradedAt: Date,
    feedback: String
  }
});

submissionSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ 'grade.gradedAt': 1 });

module.exports = mongoose.model('Submission', submissionSchema);
