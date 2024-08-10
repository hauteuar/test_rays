const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }
});

module.exports = mongoose.model('Child', childSchema);
