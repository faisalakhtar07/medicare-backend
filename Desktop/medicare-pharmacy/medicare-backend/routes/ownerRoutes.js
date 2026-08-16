import express from 'express'
import Order from '../models/Order.js'
import User from '../models/User.js'
import { protect, requireRole } from '../middleware/auth.js'
import { notifyOrderStatus, notifyDeliveryAssignment } from '../utils/notify.js'

const router = express.Router()
router.use(protect, requireRole('owner'))

const VALID_STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled']

// GET /api/owner/orders?status=Pending — every order, optionally filtered by status
router.get('/orders', async (req, res) => {
  const filter = {}
  if (req.query.status) filter.status = req.query.status
  const orders = await Order.find(filter)
    .populate('user', 'name email mobile')
    .populate('assignedTo', 'name mobile')
    .sort({ createdAt: -1 })
  res.json(orders)
})

// GET /api/owner/orders/:id
router.get('/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email mobile').populate('assignedTo', 'name mobile')
  if (!order) return res.status(404).json({ message: 'Order not found' })
  res.json(order)
})

// PUT /api/owner/orders/:id/status — move an order through Pending -> Confirmed -> Preparing -> Out for Delivery -> Delivered (or Cancelled)
router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}` })
  }
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Order not found' })
  if (status === 'Out for Delivery' && !order.assignedTo) {
    return res.status(400).json({ message: 'Assign a delivery staff member first — use the "Assign delivery" dropdown, which sets this status automatically.' })
  }
  order.status = status
  await order.save()
  await notifyOrderStatus(order.user, order)
  res.json(order)
})

// PUT /api/owner/orders/:id/assign — assign a delivery staff member to an order.
// This also moves the order to "Out for Delivery" automatically, which is what
// makes it appear on that delivery person's own dashboard — one action does both.
router.put('/orders/:id/assign', async (req, res) => {
  const { deliveryBoyId } = req.body
  const staff = await User.findOne({ _id: deliveryBoyId, role: 'delivery' })
  if (!staff) return res.status(404).json({ message: 'Delivery staff member not found' })

  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Order not found' })

  order.assignedTo = deliveryBoyId
  if (order.status !== 'Delivered' && order.status !== 'Cancelled') {
    order.status = 'Out for Delivery'
  }
  // Generate a fresh 4-digit delivery OTP every time an order goes out —
  // the customer sees it in-app; the rider must collect it from the
  // customer and enter it to mark the order Delivered.
  if (!order.deliveryOtp) {
    order.deliveryOtp = String(Math.floor(1000 + Math.random() * 9000))
  }
  await order.save()
  await notifyOrderStatus(order.user, order)
  await notifyDeliveryAssignment(deliveryBoyId, order)

  const populated = await Order.findById(order._id).populate('assignedTo', 'name mobile')
  res.json(populated)
})

// GET /api/owner/stats — quick dashboard summary
router.get('/stats', async (req, res) => {
  const [total, pending, confirmed, preparing, outForDelivery, delivered, cancelled, orders, customers] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'Pending' }),
    Order.countDocuments({ status: 'Confirmed' }),
    Order.countDocuments({ status: 'Preparing' }),
    Order.countDocuments({ status: 'Out for Delivery' }),
    Order.countDocuments({ status: 'Delivered' }),
    Order.countDocuments({ status: 'Cancelled' }),
    Order.find({ paymentStatus: 'Paid' }, 'total'),
    User.countDocuments({ role: 'customer' }),
  ])
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  res.json({ total, pending, confirmed, preparing, outForDelivery, delivered, cancelled, totalRevenue, customers })
})

// GET /api/owner/customers — every customer with order count & spend (kept from the earlier admin dashboard)
router.get('/customers', async (req, res) => {
  const users = await User.find({ role: 'customer' }).select('-password')
  const orders = await Order.find({})
  const data = users.map((u) => {
    const userOrders = orders.filter((o) => String(o.user) === String(u._id))
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      mobile: u.mobile,
      joined: u.createdAt,
      orderCount: userOrders.length,
      totalSpent: userOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    }
  })
  res.json(data.sort((a, b) => b.totalSpent - a.totalSpent))
})

export default router
