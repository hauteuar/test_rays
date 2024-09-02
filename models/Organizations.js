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

// Define the OrganizationType schema
const organizationTypeSchema = new mongoose.Schema({
  org_type_name: { type: String, required: true },
  description: { type: String },
}, { timestamps: true });

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  org_code: { type: String, unique: true }, // Organization code
  org_email: { type: String, required: true }, // Organization email
  org_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'OrganizationType' },
  org_license_number: { type: String }, // License number
  contact_person_name: { type: String },
  contact_person_number: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zip_code: String,
    country: String,
  },
  connected_pg_unique_code: { type: String }, // Payment gateway unique code
  connected_pg_payouts_enabled: { type: Boolean, default: false }, // Payouts enabled
  is_default_template: { type: Boolean, default: false }, // Template usage
  template_path: { type: String },
  logo_url: { type: String }, // URL to the organization's logo
  theme_color: String,
  domain: { type: String, unique: true },
  org_color_code: { type: String }, // Store JSON string for color codes
  deleted_at: { type: Date, default: null }, // For soft deletes
  items: [itemSchema], // Array of items under the organization
}, { timestamps: true });

module.exports = {
  Organization: mongoose.models.Organization || mongoose.model('Organization', organizationSchema),
  Item: mongoose.models.Item || mongoose.model('Item', itemSchema),
  OrganizationType: mongoose.models.OrganizationType || mongoose.model('OrganizationType', organizationTypeSchema),
};
