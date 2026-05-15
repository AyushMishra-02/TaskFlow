import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongoServer = null

const connectDB = async () => {
  // First, try the configured MONGO_URI (local / Atlas)
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    })
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`)
    return true
  } catch (err) {
    console.warn(`⚠️  Could not connect to ${process.env.MONGO_URI}: ${err.message}`)
    console.log(`🔄 Starting in-memory MongoDB server...`)
  }

  // Fallback: spin up an in-memory MongoDB instance
  try {
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    await mongoose.connect(uri)
    console.log(`✅ In-memory MongoDB connected: ${uri}`)
    console.log(`   ⚠️  Data will NOT persist across server restarts.`)
    console.log(`   💡 To persist data, install MongoDB or use MongoDB Atlas.\n`)
    return true
  } catch (fallbackErr) {
    console.error(`❌ Failed to start in-memory MongoDB: ${fallbackErr.message}`)
    return false
  }
}

export default connectDB
