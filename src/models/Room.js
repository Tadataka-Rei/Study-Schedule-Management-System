const mongoose = require('mongoose');
const { Schema } = mongoose;

const roomSchema = new Schema({
  code: { type: String, unique: true },
  building: String,
  capacity: Number,
  features: [String]
});

roomSchema.index({ capacity: 1 });

module.exports = mongoose.model('Room', roomSchema);
