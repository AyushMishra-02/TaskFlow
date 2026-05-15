import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import MembersModal from '../../components/MembersModal/MembersModal'
import CardModal from '../../components/CardModal/CardModal'
import './KanbanBoard.css'

export default function KanbanBoard() {
  const { boardId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [board, setBoard] = useState(null)
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [newListTitle, setNewListTitle] = useState('')
  const [addingList, setAddingList] = useState(false)
  const [addingCardListId, setAddingCardListId] = useState(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [editingListId, setEditingListId] = useState(null)
  const [editingListTitle, setEditingListTitle] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [userRole, setUserRole] = useState('viewer')

  // Drag state
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)
  const dragType = useRef(null) // 'card' or 'list'

  useEffect(() => { fetchBoard() }, [boardId])

  const fetchBoard = async () => {
    try {
      const { data } = await API.get(`/boards/${boardId}`)
      setBoard(data.board)
      setLists(data.lists)
      // Determine role
      if (data.board.owner?._id === user?._id) setUserRole('admin')
      else {
        const m = data.board.members?.find(m => m.user?._id === user?._id)
        setUserRole(m?.role || 'viewer')
      }
    } catch { navigate('/') }
    finally { setLoading(false) }
  }

  const canEdit = userRole === 'admin' || userRole === 'member'

  // ─── List CRUD ───
  const addList = async (e) => {
    e.preventDefault()
    if (!newListTitle.trim() || !canEdit) return
    try {
      const { data } = await API.post('/lists', { title: newListTitle, boardId })
      setLists(prev => [...prev, data])
      setNewListTitle(''); setAddingList(false)
    } catch {}
  }

  const updateListTitle = async (listId) => {
    if (!editingListTitle.trim() || !canEdit) { setEditingListId(null); return }
    try {
      await API.put(`/lists/${listId}`, { title: editingListTitle })
      setLists(prev => prev.map(l => l._id === listId ? { ...l, title: editingListTitle } : l))
    } catch {}
    setEditingListId(null)
  }

  const deleteList = async (listId) => {
    if (!canEdit || !confirm('Delete this list and all its cards?')) return
    try {
      await API.delete(`/lists/${listId}`)
      setLists(prev => prev.filter(l => l._id !== listId))
    } catch {}
  }

  // ─── Card CRUD ───
  const addCard = async (e, listId) => {
    e.preventDefault()
    if (!newCardTitle.trim() || !canEdit) return
    try {
      const { data } = await API.post('/cards', { title: newCardTitle, listId, boardId })
      setLists(prev => prev.map(l =>
        l._id === listId ? { ...l, cards: [...(l.cards||[]), data] } : l
      ))
      setNewCardTitle(''); setAddingCardListId(null)
    } catch {}
  }

  const onCardUpdated = (updated) => {
    setLists(prev => prev.map(l => ({
      ...l,
      cards: (l.cards||[]).map(c => c._id === updated._id ? updated : c)
    })))
    setSelectedCard(updated)
  }

  const onCardDeleted = (cardId) => {
    setLists(prev => prev.map(l => ({
      ...l, cards: (l.cards||[]).filter(c => c._id !== cardId)
    })))
    setSelectedCard(null)
  }

  // ─── Drag & Drop ───
  const handleDragStart = (e, type, listIdx, cardIdx) => {
    dragType.current = type
    dragItem.current = { listIdx, cardIdx }
    e.dataTransfer.effectAllowed = 'move'
    e.target.classList.add('dragging')
  }

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging')
    dragItem.current = null
    dragOverItem.current = null
  }

  const handleCardDragOver = (e, listIdx, cardIdx) => {
    e.preventDefault()
    if (dragType.current !== 'card') return
    dragOverItem.current = { listIdx, cardIdx }
  }

  const handleListDragOver = (e, listIdx) => {
    e.preventDefault()
    if (dragType.current === 'card') {
      // Dragging card over an empty list or bottom of list
      dragOverItem.current = { listIdx, cardIdx: lists[listIdx]?.cards?.length || 0 }
    }
  }

  const handleCardDrop = async (e) => {
    e.preventDefault()
    if (!canEdit || !dragItem.current || !dragOverItem.current) return
    if (dragType.current !== 'card') return

    const from = dragItem.current
    const to = dragOverItem.current
    if (from.listIdx === to.listIdx && from.cardIdx === to.cardIdx) return

    const newLists = JSON.parse(JSON.stringify(lists))
    const [movedCard] = newLists[from.listIdx].cards.splice(from.cardIdx, 1)
    movedCard.list = newLists[to.listIdx]._id
    newLists[to.listIdx].cards.splice(to.cardIdx, 0, movedCard)

    setLists(newLists)

    // Persist
    const cardsToUpdate = []
    newLists.forEach(list => {
      (list.cards || []).forEach((card, idx) => {
        cardsToUpdate.push({ id: card._id, list: list._id, position: idx })
      })
    })
    try { await API.put('/cards/reorder/batch', { cards: cardsToUpdate }) } catch {}
    dragItem.current = null; dragOverItem.current = null
  }

  const handleListDrop = async (e, toIdx) => {
    e.preventDefault()
    if (!canEdit || dragType.current !== 'list' || !dragItem.current) return
    const fromIdx = dragItem.current.listIdx
    if (fromIdx === toIdx) return

    const newLists = [...lists]
    const [moved] = newLists.splice(fromIdx, 1)
    newLists.splice(toIdx, 0, moved)
    setLists(newLists)

    try {
      await API.put('/lists/reorder/batch', {
        lists: newLists.map((l, i) => ({ id: l._id, position: i }))
      })
    } catch {}
    dragItem.current = null
  }

  const getPriorityColor = (p) => {
    const map = { urgent: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#22c55e' }
    return map[p] || map.medium
  }

  if (loading) return <div className="kanban-loading"><div className="spinner" /></div>

  return (
    <div className="kanban-page" id="kanban-page">
      <div className="kanban-topbar" style={{ background: board?.background }}>
        <div className="kanban-topbar-inner">
          <button className="kanban-back" onClick={() => navigate('/')}>← Boards</button>
          <h1 className="kanban-board-title">{board?.title}</h1>
          <div className="kanban-topbar-actions">
            <span className={`kanban-role role-${userRole}`}>{userRole}</span>
            <button className="kanban-members-btn" onClick={() => setShowMembers(true)} id="manage-members-btn">
              👥 {(board?.members?.length || 0) + 1}
            </button>
          </div>
        </div>
      </div>

      <div className="kanban-container">
        <div className="kanban-lists" id="kanban-lists">
          {lists.map((list, listIdx) => (
            <div key={list._id} className="kanban-list"
              draggable={canEdit} onDragStart={e => handleDragStart(e, 'list', listIdx)}
              onDragOver={e => { e.preventDefault(); handleListDragOver(e, listIdx) }}
              onDrop={e => handleListDrop(e, listIdx)} onDragEnd={handleDragEnd}>

              <div className="kanban-list-header">
                {editingListId === list._id ? (
                  <input className="kanban-list-edit-input" autoFocus value={editingListTitle}
                    onChange={e => setEditingListTitle(e.target.value)}
                    onBlur={() => updateListTitle(list._id)}
                    onKeyDown={e => e.key === 'Enter' && updateListTitle(list._id)} />
                ) : (
                  <h3 className="kanban-list-title" onDoubleClick={() => {
                    if (!canEdit) return; setEditingListId(list._id); setEditingListTitle(list.title)
                  }}>
                    {list.title}
                    <span className="kanban-list-count">{list.cards?.length || 0}</span>
                  </h3>
                )}
                {canEdit && (
                  <button className="kanban-list-delete" onClick={() => deleteList(list._id)} title="Delete list">×</button>
                )}
              </div>

              <div className="kanban-cards" onDragOver={e => handleListDragOver(e, listIdx)} onDrop={handleCardDrop}>
                {(list.cards || []).map((card, cardIdx) => (
                  <div key={card._id} className={`kanban-card${card.completed ? ' completed' : ''}`}
                    draggable={canEdit}
                    onDragStart={e => handleDragStart(e, 'card', listIdx, cardIdx)}
                    onDragOver={e => handleCardDragOver(e, listIdx, cardIdx)}
                    onDrop={handleCardDrop}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedCard(card)}>
                    {card.labels?.length > 0 && (
                      <div className="card-labels">
                        {card.labels.map((l, i) => (
                          <span key={i} className="card-label" style={{ background: l.color }}>{l.text}</span>
                        ))}
                      </div>
                    )}
                    <p className="card-title">{card.title}</p>
                    <div className="card-meta">
                      <span className="card-priority" style={{ color: getPriorityColor(card.priority) }}>●</span>
                      {card.dueDate && (
                        <span className={`card-due${new Date(card.dueDate) < new Date() ? ' overdue' : ''}`}>
                          📅 {new Date(card.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {card.assignee && (
                        <span className="card-assignee-chip">{card.assignee.name?.charAt(0)}</span>
                      )}
                    </div>
                  </div>
                ))}

                {addingCardListId === list._id ? (
                  <form onSubmit={e => addCard(e, list._id)} className="kanban-add-card-form">
                    <textarea autoFocus placeholder="Enter card title…" value={newCardTitle}
                      onChange={e => setNewCardTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) addCard(e, list._id) }} />
                    <div className="kanban-add-card-actions">
                      <button type="submit" className="kanban-add-card-submit">Add</button>
                      <button type="button" className="kanban-add-card-cancel"
                        onClick={() => { setAddingCardListId(null); setNewCardTitle('') }}>×</button>
                    </div>
                  </form>
                ) : canEdit && (
                  <button className="kanban-add-card-btn"
                    onClick={() => { setAddingCardListId(list._id); setNewCardTitle('') }}>
                    + Add card
                  </button>
                )}
              </div>
            </div>
          ))}

          {canEdit && (
            addingList ? (
              <div className="kanban-list kanban-add-list-form">
                <form onSubmit={addList}>
                  <input autoFocus placeholder="List title…" value={newListTitle}
                    onChange={e => setNewListTitle(e.target.value)} />
                  <div className="kanban-add-card-actions">
                    <button type="submit" className="kanban-add-card-submit">Add List</button>
                    <button type="button" className="kanban-add-card-cancel"
                      onClick={() => { setAddingList(false); setNewListTitle('') }}>×</button>
                  </div>
                </form>
              </div>
            ) : (
              <button className="kanban-add-list-btn" onClick={() => setAddingList(true)} id="add-list-btn">
                + Add List
              </button>
            )
          )}
        </div>
      </div>

      {showMembers && board && (
        <MembersModal board={board} userRole={userRole} onClose={() => setShowMembers(false)}
          onBoardUpdate={b => setBoard(b)} />
      )}

      {selectedCard && (
        <CardModal card={selectedCard} boardId={boardId} members={[
          { user: board?.owner, role: 'admin' }, ...(board?.members || [])
        ]} canEdit={canEdit} onClose={() => setSelectedCard(null)}
          onUpdate={onCardUpdated} onDelete={onCardDeleted} />
      )}
    </div>
  )
}
