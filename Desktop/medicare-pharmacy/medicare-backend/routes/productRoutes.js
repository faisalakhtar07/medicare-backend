import express from 'express'
import Product from '../models/Product.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// GET /api/products?category=&brand=&q=&minRating=&sort=
router.get('/', async (req, res) => {
  try {
    const { category, brand, q, minRating, sort, rx } = req.query
    const filter = {}
    if (category) filter.category = category
    if (brand) filter.brand = brand
    if (minRating) filter.rating = { $gte: Number(minRating) }
    if (rx === 'true') filter.prescriptionRequired = true
    if (rx === 'false') filter.prescriptionRequired = false
    if (q) filter.$text = { $search: q }

    let query = Product.find(filter)
    if (sort === 'price-asc') query = query.sort({ price: 1 })
    else if (sort === 'price-desc') query = query.sort({ price: -1 })
    else if (sort === 'rating') query = query.sort({ rating: -1 })

    const products = await query.limit(500)
    res.json(products)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) return res.status(404).json({ message: 'Product not found' })
  res.json(product)
})

// POST /api/products — admin only, create/upload new product (with real photo URL)
router.post('/', protect, adminOnly, async (req, res) => {
  const product = await Product.create(req.body)
  res.status(201).json(product)
})

// PUT /api/products/:id — admin only, e.g. to attach a real photo later
router.put('/:id', protect, adminOnly, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!product) return res.status(404).json({ message: 'Product not found' })
  res.json(product)
})

// DELETE /api/products/:id — admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id)
  res.json({ message: 'Product deleted' })
})

export default router
