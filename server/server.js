import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'
import boardRoutes from './routes/boards.js'
import listRoutes from './routes/lists.js'
import cardRoutes from './routes/cards.js'

// Load env variables
dotenv.config()

// ES module __dirname workaround
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// ─── Middleware ────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true  // allow same-origin in production (Express serves the React build)
    : 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Routes ────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/boards', boardRoutes)
app.use('/api/lists', listRoutes)
app.use('/api/cards', cardRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Serve React Build in Production ───────────────────
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '..', 'client', 'dist')
  app.use(express.static(clientBuild))

  // Any route that isn't /api/* serves the React app (client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'))
  })
}

// ─── Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: err.message || 'Internal Server Error' })
})

// ─── Start ─────────────────────────────────────────────
const startServer = async () => {
  try {
    const dbConnected = await connectDB()

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`)
      if (!dbConnected) {
        console.log(`⚠️  Server is running but MongoDB is NOT connected.`)
        console.log(`   API routes will return errors until MongoDB is available.`)
        console.log(`   Update MONGO_URI in server/.env and restart.\n`)
      } else {
        console.log(`✅ All systems operational!\n`)
      }
    })
  } catch (err) {
    console.error('❌ Failed to start server:', err.message)

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT} (DB unavailable)`)
    })
  }
}

startServer()
