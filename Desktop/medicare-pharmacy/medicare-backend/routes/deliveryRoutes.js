import express from 'express'
import Order from '../models/Order.js'
import { protect, requireRole } from '../middleware/auth.js'
import { notifyOrderStatus } from '../utils/notify.js'

const router = express.Router()
router.use(protect, requireRole('delivery'))

// A delivery rider can only push a status forward along this path.
const DELIVERY_ALLOWED_STATUSES = ['Out for Delivery', 'Delivered']

// GET /api/delivery/orders — only orders assigned to this delivery account
router.get('/orders', async (req, res) => {
  const orders = await Order.find({ assignedTo: req.user._id })
    .populate('user', 'name mobile')
    .sort({ createdAt: -1 })
  res.json(orders)
})

// GET /api/delivery/orders/:id
router.get('/orders/:id', async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, assignedTo: req.user._id }).populate('user', 'name mobile')
  if (!order) return res.status(404).json({ message: 'Order not found or not assigned to you' })
  res.json(order)
})

// PUT /api/delivery/orders/:id/status — delivery staff can only move Out for Delivery -> Delivered.
// Marking Delivered REQUIRES the correct OTP, collected verbally from the customer,
// which proves the parcel reached the right person.
router.put('/orders/:id/status', async (req, res) => {
  const { status, otp } = req.body
  if (!DELIVERY_ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Delivery staff can only set status to: ${DELIVERY_ALLOWED_STATUSES.join(' or ')}` })
  }
  const order = await Order.findOne({ _id: req.params.id, assignedTo: req.user._id })
  if (!order) return res.status(404).json({ message: 'Order not found or not assigned to you' })

  if (status === 'Delivered') {
    if (!order.deliveryOtp) {
      return res.status(400).json({ message: 'No OTP was generated for this order — contact the owner.' })
    }
    if (!otp || String(otp).trim() !== order.deliveryOtp) {
      return res.status(400).json({ message: 'Incorrect OTP. Ask the customer to check their app for the correct code.' })
    }
    order.deliveryVerifiedAt = new Date()
  }

  order.status = status
  await order.save()
  await notifyOrderStatus(order.user, order)
  res.json(order)
})

export default router
