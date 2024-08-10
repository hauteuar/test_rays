const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Child' }]
});

module.exports = mongoose.model('Parent', parentSchema);
