import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    brand: String,
    image: String,
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
)

const statusHistorySchema = new mongoose.Schema(
  {
    status: String,
    at: { type: Date, default: Date.now },
    note: String,
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, required: true, unique: true },
    items: [orderItemSchema],
    address: {
      fullName: String,
      mobile: String,
      house: String,
      street: String,
      area: String,
      city: String,
      state: String,
      pin: String,
    },
    itemTotal: Number,
    discount: Number,
    deliveryFee: Number,
    total: { type: Number, required: true },
    deliveryMethod: { type: String, enum: ['standard', 'express'], default: 'standard' },

    // --- Order fulfilment workflow (owner-controlled) ---
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    statusHistory: [statusHistorySchema],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true }, // delivery staff

    // --- Payment ---
    paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking', 'cod'], default: 'cod' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending', index: true },

    // 4-digit code shown only to the customer (in-app), never to the delivery
    // rider. The rider must ask the customer for it and enter it to confirm
    // the parcel reached the right person — free, no SMS/WhatsApp cost.
    deliveryOtp: { type: String, default: null },
    deliveryVerifiedAt: { type: Date, default: null },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },

    prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  },
  { timestamps: true }
)

orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status, at: new Date() })
  }
  next()
})

export default mongoose.model('Order', orderSchema)
