import express from 'express'
import User from '../models/User.js'
import Order from '../models/Order.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()
router.use(protect, adminOnly)

// GET /api/admin/customers — every customer with their order count & total spend
router.get('/customers', async (req, res) => {
  const users = await User.find({ isAdmin: false }).select('-password')
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

// GET /api/admin/customers/:id — everything one specific customer bought
router.get('/customers/:id', async (req, res) => {
  const user = await User.findById(req.params.id).select('-password')
  if (!user) return res.status(404).json({ message: 'Customer not found' })
  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 })
  res.json({ user, orders })
})

// GET /api/admin/stats — quick summary numbers for a dashboard homepage
router.get('/stats', async (req, res) => {
  const [totalOrders, totalCustomers, orders] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments({ isAdmin: false }),
    Order.find({}, 'total createdAt'),
  ])
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  res.json({ totalOrders, totalCustomers, totalRevenue })
})

export default router
