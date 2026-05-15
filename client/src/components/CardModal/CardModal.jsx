import { useState } from 'react'
import API from '../../api/axios'
import './CardModal.css'

const LABEL_COLORS = ['#ef4444','#f59e0b','#22c55e','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#64748b']

export default function CardModal({ card, boardId, members, canEdit, onClose, onUpdate, onDelete }) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [priority, setPriority] = useState(card.priority || 'medium')
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.slice(0, 10) : '')
  const [assignee, setAssignee] = useState(card.assignee?._id || '')
  const [labels, setLabels] = useState(card.labels || [])
  const [newLabelText, setNewLabelText] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0])
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!canEdit) return
    setSaving(true)
    try {
      const { data } = await API.put(`/cards/${card._id}`, {
        title, description, priority, dueDate: dueDate || null,
        assignee: assignee || null, labels,
      })
      onUpdate(data)
    } catch {} finally { setSaving(false) }
  }

  const toggleComplete = async () => {
    if (!canEdit) return
    try {
      const { data } = await API.put(`/cards/${card._id}`, { completed: !card.completed })
      onUpdate(data)
    } catch {}
  }

  const handleDelete = async () => {
    if (!canEdit || !confirm('Delete this card?')) return
    try { await API.delete(`/cards/${card._id}`); onDelete(card._id) } catch {}
  }

  const addLabel = () => {
    if (!newLabelText.trim()) return
    setLabels(prev => [...prev, { text: newLabelText.trim(), color: newLabelColor }])
    setNewLabelText('')
  }

  const removeLabel = (idx) => setLabels(prev => prev.filter((_, i) => i !== idx))

  return (
    <div className="card-modal-overlay" onClick={onClose}>
      <div className="card-modal" onClick={e => e.stopPropagation()} id="card-detail-modal">
        <div className="card-modal-header">
          <h2>Card Details</h2>
          <button className="card-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="card-modal-body">
          <div className="cm-field">
            <label>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} disabled={!canEdit} id="card-title-input" />
          </div>

          <div className="cm-field">
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} placeholder="Add a description…" disabled={!canEdit} id="card-desc-input" />
          </div>

          <div className="cm-row">
            <div className="cm-field cm-half">
              <label>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} disabled={!canEdit} id="card-priority-select">
                <option value="low">🟢 Low</option>
                <option value="medium">🔵 Medium</option>
                <option value="high">🟡 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
            <div className="cm-field cm-half">
              <label>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} disabled={!canEdit} id="card-due-input" />
            </div>
          </div>

          <div className="cm-field">
            <label>Assignee</label>
            <select value={assignee} onChange={e => setAssignee(e.target.value)} disabled={!canEdit} id="card-assignee-select">
              <option value="">Unassigned</option>
              {members?.map(m => (
                <option key={m.user?._id} value={m.user?._id}>{m.user?.name} ({m.role})</option>
              ))}
            </select>
          </div>

          <div className="cm-field">
            <label>Labels</label>
            <div className="cm-labels">
              {labels.map((l, i) => (
                <span key={i} className="cm-label" style={{ background: l.color }}>
                  {l.text}
                  {canEdit && <button onClick={() => removeLabel(i)}>×</button>}
                </span>
              ))}
            </div>
            {canEdit && (
              <div className="cm-add-label">
                <input placeholder="Label text" value={newLabelText} onChange={e => setNewLabelText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addLabel()} />
                <div className="cm-label-colors">
                  {LABEL_COLORS.map(c => (
                    <button key={c} className={`cm-color-btn${newLabelColor === c ? ' active' : ''}`}
                      style={{ background: c }} onClick={() => setNewLabelColor(c)} />
                  ))}
                </div>
                <button className="cm-add-label-btn" onClick={addLabel}>+ Add</button>
              </div>
            )}
          </div>

          <div className="cm-status">
            <button className={`cm-complete-btn${card.completed ? ' done' : ''}`}
              onClick={toggleComplete} disabled={!canEdit}>
              {card.completed ? '✅ Completed' : '⬜ Mark Complete'}
            </button>
          </div>
        </div>

        {canEdit && (
          <div className="card-modal-footer">
            <button className="cm-delete-btn" onClick={handleDelete} id="card-delete-btn">🗑 Delete</button>
            <button className="cm-save-btn" onClick={save} disabled={saving} id="card-save-btn">
              {saving ? 'Saving…' : '💾 Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
