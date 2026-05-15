import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import './BoardsPage.css'

const BG_OPTIONS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)',
]

export default function BoardsPage() {
  const [boards, setBoards] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [bg, setBg] = useState(BG_OPTIONS[0])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    API.get('/boards').then(r => { setBoards(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const create = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      const { data } = await API.post('/boards', { title, description: desc, background: bg })
      setBoards(prev => [data, ...prev])
      setTitle(''); setDesc(''); setShowCreate(false)
    } catch {}
  }

  const getUserRole = (board) => {
    if (board.owner?._id === user?._id) return 'admin'
    const m = board.members?.find(m => m.user?._id === user?._id)
    return m?.role || 'viewer'
  }

  return (
    <div className="boards-page" id="boards-page">
      <div className="boards-header">
        <div>
          <h1>Your Boards</h1>
          <p className="boards-subtitle">{boards.length} board{boards.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="boards-create-btn" id="create-board-btn" onClick={() => setShowCreate(true)}>
          <span>+</span> New Board
        </button>
      </div>

      {showCreate && (
        <div className="boards-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="boards-modal" onClick={e => e.stopPropagation()}>
            <h2>Create Board</h2>
            <form onSubmit={create}>
              <div className="boards-preview" style={{ background: bg }}>
                <span className="boards-preview-title">{title || 'Board Title'}</span>
              </div>
              <div className="bg-picker">
                {BG_OPTIONS.map((b, i) => (
                  <button key={i} type="button" className={`bg-swatch${bg===b?' active':''}`}
                    style={{ background: b }} onClick={() => setBg(b)} />
                ))}
              </div>
              <input placeholder="Board title *" value={title} onChange={e => setTitle(e.target.value)} required id="board-title-input" />
              <textarea placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} rows={2} id="board-desc-input" />
              <div className="modal-actions">
                <button type="button" className="modal-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="modal-submit" id="board-create-submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="boards-loading"><div className="spinner" /></div>
      ) : boards.length === 0 ? (
        <div className="boards-empty">
          <span className="boards-empty-icon">📌</span>
          <h2>No boards yet</h2>
          <p>Create your first board to get started</p>
        </div>
      ) : (
        <div className="boards-grid">
          {boards.map(board => (
            <div key={board._id} className="board-card" onClick={() => navigate(`/board/${board._id}`)}
              style={{ background: board.background || BG_OPTIONS[0] }}>
              <div className="board-card-content">
                <h3>{board.title}</h3>
                {board.description && <p>{board.description}</p>}
                <div className="board-card-meta">
                  <span className={`board-role role-${getUserRole(board)}`}>{getUserRole(board)}</span>
                  <div className="board-members-count">
                    👥 {(board.members?.length || 0) + 1}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
