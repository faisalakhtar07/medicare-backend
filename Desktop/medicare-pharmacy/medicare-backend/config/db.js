import mongoose from 'mongoose'

export default async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    console.error('   Make sure MongoDB is installed and running locally (mongod).')
    process.exit(1)
  }
}
