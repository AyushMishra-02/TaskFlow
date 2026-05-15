import express from 'express'
import Board from '../models/Board.js'
import List from '../models/List.js'
import Card from '../models/Card.js'
import protect from '../middleware/auth.js'
import boardAccess from '../middleware/boardAccess.js'

const router = express.Router()

// All board routes require authentication
router.use(protect)

/**
 * @route   GET /api/boards
 * @desc    Get all boards the user owns or is a member of
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id },
      ],
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 })

    res.json(boards)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * @route   POST /api/boards
 * @desc    Create a new board
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, background } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Board title is required' })
    }

    const board = await Board.create({
      title: title.trim(),
      description: description?.trim() || '',
      owner: req.user._id,
      background: background || undefined,
      members: [],
    })

    // Populate owner info before returning
    await board.populate('owner', 'name email avatar')

    res.status(201).json(board)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * @route   GET /api/boards/:id
 * @desc    Get a single board with all its lists and cards
 * @access  Private (board member or owner)
 */
router.get('/:id', boardAccess(['admin', 'member', 'viewer']), async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')

    const lists = await List.find({ board: req.params.id })
      .sort({ position: 1 })

    const cards = await Card.find({ board: req.params.id })
      .populate('assignee', 'name email avatar')
      .sort({ position: 1 })

    // Group cards by list
    const listsWithCards = lists.map((list) => ({
      ...list.toJSON(),
      cards: cards.filter((c) => c.list.toString() === list._id.toString()),
    }))

    res.json({ board, lists: listsWithCards })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * @route   PUT /api/boards/:id
 * @desc    Update board details
 * @access  Private (admin only)
 */
router.put('/:id', boardAccess(['admin']), async (req, res) => {
  try {
    const { title, description, background } = req.body
    const board = req.board

    if (title !== undefined) board.title = title.trim()
    if (description !== undefined) board.description = description.trim()
    if (background !== undefined) board.background = background

    const updated = await board.save()
    await updated.populate('owner', 'name email avatar')
    await updated.populate('members.user', 'name email avatar')

    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * @route   DELETE /api/boards/:id
 * @desc    Delete a board and all its lists/cards
 * @access  Private (admin only)
 */
router.delete('/:id', boardAccess(['admin']), async (req, res) => {
  try {
    await Card.deleteMany({ board: req.params.id })
    await List.deleteMany({ board: req.params.id })
    await Board.findByIdAndDelete(req.params.id)

    res.json({ message: 'Board deleted', id: req.params.id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * @route   POST /api/boards/:id/members
 * @desc    Add a member to the board
 * @access  Private (admin only)
 */
router.post('/:id/members', boardAccess(['admin']), async (req, res) => {
  try {
    const { userId, role } = req.body
    const board = req.board

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' })
    }

    // Check if already a member
    const existing = board.members.find(
      (m) => m.user.toString() === userId
    )
    if (existing) {
      return res.status(400).json({ message: 'User is already a member' })
    }

    // Can't add yourself (you're the owner)
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You are already the owner' })
    }

    board.members.push({ user: userId, role: role || 'member' })
    await board.save()
    await board.populate('owner', 'name email avatar')
    await board.populate('members.user', 'name email avatar')

    res.json(board)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * @route   PUT /api/boards/:id/members/:memberId
 * @desc    Update a member's role
 * @access  Private (admin only)
 */
router.put('/:id/members/:memberId', boardAccess(['admin']), async (req, res) => {
  try {
    const { role } = req.body
    const board = req.board

    const member = board.members.id(req.params.memberId)
    if (!member) {
      return res.status(404).json({ message: 'Member not found' })
    }

    member.role = role || member.role
    await board.save()
    await board.populate('owner', 'name email avatar')
    await board.populate('members.user', 'name email avatar')

    res.json(board)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * @route   DELETE /api/boards/:id/members/:memberId
 * @desc    Remove a member from the board
 * @access  Private (admin only)
 */
router.delete('/:id/members/:memberId', boardAccess(['admin']), async (req, res) => {
  try {
    const board = req.board
    board.members.pull({ _id: req.params.memberId })
    await board.save()
    await board.populate('owner', 'name email avatar')
    await board.populate('members.user', 'name email avatar')

    res.json(board)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
