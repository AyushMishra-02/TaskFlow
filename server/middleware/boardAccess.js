import Board from '../models/Board.js'

/**
 * Board access middleware — checks if the user has access to a board
 * and attaches the board & user's role to the request object.
 *
 * @param {string[]} allowedRoles — roles that can access this route (e.g. ['admin','member'])
 */
const boardAccess = (allowedRoles = ['admin', 'member', 'viewer']) => {
  return async (req, res, next) => {
    try {
      const boardId = req.params.boardId || req.body.boardId || req.params.id

      if (!boardId) {
        return res.status(400).json({ message: 'Board ID is required' })
      }

      const board = await Board.findById(boardId)

      if (!board) {
        return res.status(404).json({ message: 'Board not found' })
      }

      // Check if user is owner (always has admin access)
      const isOwner = board.owner.toString() === req.user._id.toString()

      if (isOwner) {
        req.board = board
        req.boardRole = 'admin'
        return next()
      }

      // Check membership
      const membership = board.members.find(
        (m) => m.user.toString() === req.user._id.toString()
      )

      if (!membership) {
        return res.status(403).json({ message: 'You do not have access to this board' })
      }

      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({
          message: `This action requires one of: ${allowedRoles.join(', ')}`,
        })
      }

      req.board = board
      req.boardRole = membership.role
      next()
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
}

export default boardAccess
