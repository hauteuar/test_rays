const mongoose = require('mongoose');

const PriceDetailSchema = new mongoose.Schema({
  sport: { type: mongoose.Schema.Types.ObjectId, ref: 'Sport' },
  court: { type: mongoose.Schema.Types.ObjectId, ref: 'Court' },
  normalRate: Number,
  specialRates: [{
    day: { type: String, enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
    morningRate: Number,
    afternoonRate: Number,
    eveningRate: Number,
  }],
});

const PriceDetail = mongoose.model('PriceDetail', PriceDetailSchema);

module.exports = PriceDetail;
