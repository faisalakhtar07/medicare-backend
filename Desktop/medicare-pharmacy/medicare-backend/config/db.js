import mongoose from 'mongoose'
import dns from 'dns'

// Force Node to resolve DNS (including the mongodb+srv:// lookup) via Google's
// public DNS. Some ISPs/routers block or mishandle SRV record lookups even
// when Windows network settings say to use 8.8.8.8 — setting it here, inside
// Node itself, sidesteps that.
dns.setServers(['8.8.8.8', '8.8.4.4'])

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
