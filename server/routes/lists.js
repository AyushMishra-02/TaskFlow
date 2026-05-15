import express from 'express'
import List from '../models/List.js'
import Card from '../models/Card.js'
import protect from '../middleware/auth.js'
import boardAccess from '../middleware/boardAccess.js'

const router = express.Router()

// All list routes require authentication
router.use(protect)

/**
 * @route   POST /api/lists
 * @desc    Create a new list in a board
 * @access  Private (admin, member)
 */
router.post('/', async (req, res) => {
  try {
    const { title, boardId } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'List title is required' })
    }

    if (!boardId) {
      return res.status(400).json({ message: 'Board ID is required' })
    }

    // Get the highest position in this board
    const lastList = await List.findOne({ board: boardId }).sort({ position: -1 })
    const position = lastList ? lastList.position + 1 : 0

    const list = await List.create({
      title: title.trim(),
      board: boardId,
      position,
    })

    res.status(201).json({ ...list.toJSON(), cards: [] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * @route   PUT /api/lists/:id
 * @desc    Update a list title
 * @access  Private (admin, member)
 */
router.put('/:id', async (req, res) => {
  try {
    const list = await List.findById(req.params.id)

    if (!list) {
      return res.status(404).json({ message: 'List not found' })
    }

    const { title } = req.body
    if (title !== undefined) list.title = title.trim()

    const updated = await list.save()
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * @route   DELETE /api/lists/:id
 * @desc    Delete a list and all its cards
 * @access  Private (admin, member)
 */
router.delete('/:id', async (req, res) => {
  try {
    const list = await List.findById(req.params.id)

    if (!list) {
      return res.status(404).json({ message: 'List not found' })
    }

    // Delete all cards in this list
    await Card.deleteMany({ list: list._id })
    await list.deleteOne()

    res.json({ message: 'List deleted', id: req.params.id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * @route   PUT /api/lists/reorder
 * @desc    Reorder lists within a board
 * @access  Private (admin, member)
 */
router.put('/reorder/batch', async (req, res) => {
  try {
    const { lists } = req.body // [{ id, position }]

    if (!lists || !Array.isArray(lists)) {
      return res.status(400).json({ message: 'Lists array is required' })
    }

    const bulkOps = lists.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { position: item.position },
      },
    }))

    await List.bulkWrite(bulkOps)
    res.json({ message: 'Lists reordered' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
