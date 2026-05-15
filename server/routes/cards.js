import express from 'express'
import Card from '../models/Card.js'
import protect from '../middleware/auth.js'

const router = express.Router()

// All card routes require authentication
router.use(protect)

/**
 * @route   POST /api/cards
 * @desc    Create a new card in a list
 * @access  Private (admin, member)
 */
router.post('/', async (req, res) => {
  try {
    const { title, listId, boardId, description, priority, dueDate, labels } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Card title is required' })
    }

    if (!listId || !boardId) {
      return res.status(400).json({ message: 'List ID and Board ID are required' })
    }

    // Get the highest position in this list
    const lastCard = await Card.findOne({ list: listId }).sort({ position: -1 })
    const position = lastCard ? lastCard.position + 1 : 0

    const card = await Card.create({
      title: title.trim(),
      description: description?.trim() || '',
      list: listId,
      board: boardId,
      position,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      labels: labels || [],
    })

    await card.populate('assignee', 'name email avatar')
    res.status(201).json(card)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * @route   PUT /api/cards/:id
 * @desc    Update a card
 * @access  Private (admin, member)
 */
router.put('/:id', async (req, res) => {
  try {
    const card = await Card.findById(req.params.id)

    if (!card) {
      return res.status(404).json({ message: 'Card not found' })
    }

    const { title, description, priority, dueDate, labels, assignee, completed } = req.body

    if (title !== undefined) card.title = title.trim()
    if (description !== undefined) card.description = description.trim()
    if (priority !== undefined) card.priority = priority
    if (dueDate !== undefined) card.dueDate = dueDate
    if (labels !== undefined) card.labels = labels
    if (assignee !== undefined) card.assignee = assignee || null
    if (completed !== undefined) card.completed = completed

    const updated = await card.save()
    await updated.populate('assignee', 'name email avatar')
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * @route   DELETE /api/cards/:id
 * @desc    Delete a card
 * @access  Private (admin, member)
 */
router.delete('/:id', async (req, res) => {
  try {
    const card = await Card.findById(req.params.id)

    if (!card) {
      return res.status(404).json({ message: 'Card not found' })
    }

    await card.deleteOne()
    res.json({ message: 'Card deleted', id: req.params.id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * @route   PUT /api/cards/reorder/batch
 * @desc    Reorder cards (move within/between lists)
 * @access  Private (admin, member)
 */
router.put('/reorder/batch', async (req, res) => {
  try {
    const { cards } = req.body // [{ id, list, position }]

    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({ message: 'Cards array is required' })
    }

    const bulkOps = cards.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { list: item.list, position: item.position },
      },
    }))

    await Card.bulkWrite(bulkOps)
    res.json({ message: 'Cards reordered' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
