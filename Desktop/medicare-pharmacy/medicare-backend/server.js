import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import connectDB from './config/db.js'

import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import miscRoutes from './routes/miscRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import staffAuthRoutes from './routes/staffAuthRoutes.js'
import ownerRoutes from './routes/ownerRoutes.js'
import deliveryRoutes from './routes/deliveryRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'

connectDB()

const app = express()
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.resolve('uploads')))

app.get('/', (req, res) => res.send('MEDICARE API is running ✅'))

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api', miscRoutes) // /doctors, /labtests, /consultations, /labbookings, /prescriptions
app.use('/api/admin', adminRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/staff', staffAuthRoutes)
app.use('/api/owner', ownerRoutes)
app.use('/api/delivery', deliveryRoutes)
app.use('/api/notifications', notificationRoutes)

app.use((req, res) => res.status(404).json({ message: 'Route not found' }))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: err.message || 'Server error' })
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MEDICARE API running on http://localhost:${PORT}`))
