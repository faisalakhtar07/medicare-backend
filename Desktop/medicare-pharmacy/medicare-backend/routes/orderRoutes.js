import express from 'express'
import Order from '../models/Order.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { notifyOrderStatus, notifyNewOrderToOwners } from '../utils/notify.js'

const router = express.Router()

// POST /api/orders — place a new order (requires login)
router.post('/', protect, async (req, res) => {
  try {
    const { items, address, itemTotal, discount, deliveryFee, total, deliveryMethod, paymentMethod, prescription } = req.body
    if (!items?.length) return res.status(400).json({ message: 'Cart is empty' })

    const orderNumber = 'MC' + Date.now().toString().slice(-8)
    const order = await Order.create({
      user: req.user._id,
      orderNumber,
      items,
      address,
      itemTotal,
      discount,
      deliveryFee,
      total,
      deliveryMethod,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Pending',
      prescription,
    })
    await notifyOrderStatus(req.user._id, order)
    await notifyNewOrderToOwners(order)
    res.status(201).json(order)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/orders/mine — logged-in customer's own order history
router.get('/mine', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json(orders)
})

// GET /api/orders/:id — a single order (owner or admin only)
router.get('/:id', protect, async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email mobile').populate('assignedTo', 'name mobile')
  if (!order) return res.status(404).json({ message: 'Order not found' })
  if (String(order.user._id) !== String(req.user._id) && !req.user.isAdmin && req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Not authorized to view this order' })
  }
  res.json(order)
})

// GET /api/orders — ADMIN ONLY: see every customer's orders (this is your "who bought what" dashboard)
router.get('/', protect, adminOnly, async (req, res) => {
  const orders = await Order.find({}).populate('user', 'name email mobile').sort({ createdAt: -1 })
  res.json(orders)
})

// PUT /api/orders/:id/status — ADMIN/OWNER ONLY: update order status
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Order not found' })
  order.status = req.body.status
  await order.save()
  await notifyOrderStatus(order.user, order)
  res.json(order)
})

export default router
