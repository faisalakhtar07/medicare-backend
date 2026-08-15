import express from 'express'
import User from '../models/User.js'
import { protect, generateToken } from '../middleware/auth.js'

const router = express.Router()

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }
    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(409).json({ message: 'An account with this email already exists' })

    // Customers can NEVER become owner/admin through normal signup — that
    // path is only via /api/staff/register with a valid access code. This
    // closes the earlier gap where signing up with a special email granted
    // access to revenue/business data.
    const user = await User.create({ name, email, mobile, password, isAdmin: false, role: 'customer' })

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

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email: email?.toLowerCase() })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
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

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json(req.user)
})

// POST /api/auth/addresses — add a saved delivery address
router.post('/addresses', protect, async (req, res) => {
  const isFirst = req.user.addresses.length === 0
  req.user.addresses.push({ ...req.body, isDefault: isFirst ? true : !!req.body.isDefault })
  if (req.body.isDefault) {
    req.user.addresses.forEach((a) => {
      if (a._id.toString() !== req.user.addresses[req.user.addresses.length - 1]._id.toString()) a.isDefault = false
    })
  }
  await req.user.save()
  res.status(201).json(req.user.addresses)
})

// GET /api/auth/addresses
router.get('/addresses', protect, async (req, res) => {
  res.json(req.user.addresses)
})

// PUT /api/auth/addresses/:addressId — edit an existing address
router.put('/addresses/:addressId', protect, async (req, res) => {
  const addr = req.user.addresses.id(req.params.addressId)
  if (!addr) return res.status(404).json({ message: 'Address not found' })
  Object.assign(addr, req.body)
  if (req.body.isDefault) {
    req.user.addresses.forEach((a) => {
      a.isDefault = a._id.toString() === req.params.addressId
    })
  }
  await req.user.save()
  res.json(req.user.addresses)
})

// DELETE /api/auth/addresses/:addressId
router.delete('/addresses/:addressId', protect, async (req, res) => {
  const addr = req.user.addresses.id(req.params.addressId)
  if (!addr) return res.status(404).json({ message: 'Address not found' })
  const wasDefault = addr.isDefault
  addr.deleteOne()
  if (wasDefault && req.user.addresses.length > 0) {
    req.user.addresses[0].isDefault = true
  }
  await req.user.save()
  res.json(req.user.addresses)
})

// PUT /api/auth/addresses/:addressId/default — mark one address as the default
router.put('/addresses/:addressId/default', protect, async (req, res) => {
  const found = req.user.addresses.id(req.params.addressId)
  if (!found) return res.status(404).json({ message: 'Address not found' })
  req.user.addresses.forEach((a) => {
    a.isDefault = a._id.toString() === req.params.addressId
  })
  await req.user.save()
  res.json(req.user.addresses)
})

export default router
