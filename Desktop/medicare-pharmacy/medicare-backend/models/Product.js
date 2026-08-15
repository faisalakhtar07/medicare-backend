import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true },
    generic: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, default: '' },
    packSize: { type: String, default: '' },
    mrp: { type: Number, required: true },
    price: { type: Number, required: true },
    rating: { type: Number, default: 4.3 },
    reviews: { type: Number, default: 0 },
    prescriptionRequired: { type: Boolean, default: false },
    inStock: { type: Boolean, default: true },
    // Falls back to a category placeholder on the frontend if empty.
    // Replace with a real photo URL any time via the admin panel / API.
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    manufacturer: { type: String, default: '' },
    country: { type: String, default: 'India' },
  },
  { timestamps: true }
)

productSchema.index({ name: 'text', brand: 'text', generic: 'text' })

export default mongoose.model('Product', productSchema)
