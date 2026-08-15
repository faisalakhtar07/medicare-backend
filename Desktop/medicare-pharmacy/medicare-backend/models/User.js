import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    fullName: String,
    mobile: String,
    house: String,
    street: String,
    area: String,
    city: String,
    state: String,
    pin: String,
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    // 'customer' = normal shopper, 'owner' = pharmacy business owner, 'delivery' = delivery staff
    role: { type: String, enum: ['customer', 'owner', 'delivery'], default: 'customer', index: true },
    // Kept for backward compatibility with the earlier admin dashboard; owner === admin now.
    isAdmin: { type: Boolean, default: false },
    active: { type: Boolean, default: true }, // owner can deactivate a delivery staff account
    addresses: [addressSchema],
  },
  { timestamps: true }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

export default mongoose.model('User', userSchema)
