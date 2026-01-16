const mongoose = require('mongoose');
const { Schema } = mongoose;

const auditLogSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, enum: ['create', 'update', 'delete'] },
  entity: {
    collectionName: String,
    id: Schema.Types.ObjectId
  },
  diff: {
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed
  },
  at: { type: Date, default: Date.now }
});

auditLogSchema.index({ 'entity.collectionName': 1, 'entity.id': 1 });
auditLogSchema.index({ actorId: 1, at: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
