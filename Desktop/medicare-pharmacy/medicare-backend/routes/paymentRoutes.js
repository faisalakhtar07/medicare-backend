import express from 'express'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import Order from '../models/Order.js'
import { protect } from '../middleware/auth.js'
import { notifyPayment } from '../utils/notify.js'

const router = express.Router()

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

// GET /api/payments/key — frontend needs the public key id to open the Razorpay checkout widget
router.get('/key', (req, res) => {
  if (!process.env.RAZORPAY_KEY_ID) {
    return res.status(503).json({ configured: false, message: 'Razorpay is not configured on this server yet' })
  }
  res.json({ configured: true, keyId: process.env.RAZORPAY_KEY_ID })
})

// POST /api/payments/create-order — creates a Razorpay order for a MEDICARE order that already exists in our DB
router.post('/create-order', protect, async (req, res) => {
  try {
    const razorpay = getRazorpay()
    if (!razorpay) {
      return res.status(503).json({
        message:
          'Online payments are not set up yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend .env file (free test-mode keys from dashboard.razorpay.com), then restart the server.',
      })
    }

    const { orderId } = req.body
    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100), // paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { medicareOrderId: String(order._id) },
    })

    order.razorpayOrderId = razorpayOrder.id
    await order.save()

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderNumber: order.orderNumber,
      customerName: order.address?.fullName,
      customerContact: order.address?.mobile,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/payments/verify — verifies the signature Razorpay's checkout widget returns after payment.
// This server-side check is what actually determines "Paid" — never trust the frontend alone.
router.post('/verify', protect, async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const isValid = expectedSignature === razorpay_signature

    order.razorpayPaymentId = razorpay_payment_id
    order.razorpaySignature = razorpay_signature
    order.paymentStatus = isValid ? 'Paid' : 'Failed'
    if (isValid && order.status === 'Pending') order.status = 'Confirmed'
    await order.save()
    await notifyPayment(order.user, order, isValid)

    if (!isValid) return res.status(400).json({ message: 'Payment verification failed — signature mismatch', verified: false })
    res.json({ message: 'Payment verified', verified: true, order })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/payments/mark-failed — call this if the user closes/cancels the Razorpay popup
router.post('/mark-failed', protect, async (req, res) => {
  const { orderId } = req.body
  const order = await Order.findById(orderId)
  if (!order) return res.status(404).json({ message: 'Order not found' })
  order.paymentStatus = 'Failed'
  await order.save()
  await notifyPayment(order.user, order, false)
  res.json({ message: 'Marked as failed', order })
})

export default router
