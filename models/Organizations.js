const mongoose = require('mongoose');

// Define the Item schema
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  size: { type: String }, // Optional, for items like clothing
  imageUrl: { type: String, required: true }, // Store the URL of the uploaded image
  stock: { type: Number, default: 0 }, // Optional, for tracking inventory
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
}, { timestamps: true });

// Add the Item schema to the Organization schema
const organizationSchema = new mongoose.Schema({
  name: String,
  logo_url: String,
  theme_color: String,
  domain: { type: String, unique: true },
  courses: [
    {
      course_id: mongoose.Schema.Types.ObjectId,
      name: String,
      description: String,
      batches: [
        {
          batch_id: mongoose.Schema.Types.ObjectId,
          name: String,
          coaches: [{ coach_id: mongoose.Schema.Types.ObjectId }],
          students: [{ student_id: mongoose.Schema.Types.ObjectId }]
        }
      ]
    }
  ],
  items: [itemSchema] // Array of items under the organization
}, { timestamps: true });

module.exports = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
module.exports.Item = mongoose.models.Item || mongoose.model('Item', itemSchema);
