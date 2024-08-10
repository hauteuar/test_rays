const mongoose = require('mongoose');

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
  ]
}, { timestamps: true });

module.exports = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
