import express from 'express'
import User from '../models/User.js'
import { protect, requireRole, generateToken } from '../middleware/auth.js'

const router = express.Router()

function codeForRole(role) {
  if (role === 'owner') return process.env.OWNER_ACCESS_CODE
  if (role === 'delivery') return process.env.DELIVERY_ACCESS_CODE
  return null
}

// POST /api/staff/register — create an owner or delivery account.
// Requires the correct access code for that role (set in .env). Without the
// correct code, nobody can create a staff account — this is the "secure code" gate.
router.post('/register', async (req, res) => {
  try {
    const { name, email, mobile, password, role, accessCode } = req.body
    if (!['owner', 'delivery'].includes(role)) {
      return res.status(400).json({ message: 'Role must be owner or delivery' })
    }
    const expectedCode = codeForRole(role)
    if (!expectedCode || accessCode !== expectedCode) {
      return res.status(403).json({ message: 'Invalid access code' })
    }
    const exists = await User.findOne({ email: email?.toLowerCase() })
    if (exists) return res.status(409).json({ message: 'An account with this email already exists' })

    const user = await User.create({
      name,
      email,
      mobile,
      password,
      role,
      isAdmin: role === 'owner',
    })

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/staff/login — email + password + access code (extra security layer
// beyond the password, so a leaked customer password alone can never reach
// the owner/delivery dashboards).
router.post('/login', async (req, res) => {
  try {
    const { email, password, role, accessCode } = req.body
    const expectedCode = codeForRole(role)
    if (!expectedCode || accessCode !== expectedCode) {
      return res.status(403).json({ message: 'Invalid access code' })
    }
    const user = await User.findOne({ email: email?.toLowerCase(), role })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    if (user.active === false) {
      return res.status(403).json({ message: 'This account has been deactivated' })
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/staff/delivery-list — owner only: list of delivery staff for assigning orders
router.get('/delivery-list', protect, requireRole('owner'), async (req, res) => {
  const staff = await User.find({ role: 'delivery' }).select('-password')
  res.json(staff)
})

// PUT /api/staff/:id/active — owner only: activate/deactivate a delivery account
router.put('/:id/active', protect, requireRole('owner'), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { active: req.body.active }, { new: true }).select('-password')
  if (!user) return res.status(404).json({ message: 'Staff member not found' })
  res.json(user)
})

export default router
