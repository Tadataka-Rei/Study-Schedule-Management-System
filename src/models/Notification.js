const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  category: { type: String, enum: ['schedule', 'deadline', 'registration', 'system'] },
  title: String,
  body: String,
  related: {
    eventId: Schema.Types.ObjectId,
    assessmentId: Schema.Types.ObjectId,
    registrationId: Schema.Types.ObjectId
  },
  status: { type: String, enum: ['unread', 'read', 'dismissed'], default: 'unread' },
  sendAt: { type: Date, default: Date.now },
  readAt: Date
});

notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ sendAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
