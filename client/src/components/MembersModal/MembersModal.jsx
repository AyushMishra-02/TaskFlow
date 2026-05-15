import { useState } from 'react'
import API from '../../api/axios'
import './MembersModal.css'

export default function MembersModal({ board, userRole, onClose, onBoardUpdate }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [addRole, setAddRole] = useState('member')

  const isAdmin = userRole === 'admin'

  const search = async (q) => {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const { data } = await API.get(`/auth/users/search?q=${encodeURIComponent(q)}`)
      // Filter out existing members
      const existingIds = [board.owner?._id, ...board.members.map(m => m.user?._id)]
      setSearchResults(data.filter(u => !existingIds.includes(u._id)))
    } catch {} finally { setSearching(false) }
  }

  const addMember = async (userId) => {
    try {
      const { data } = await API.post(`/boards/${board._id}/members`, { userId, role: addRole })
      onBoardUpdate(data)
      setSearchResults(prev => prev.filter(u => u._id !== userId))
    } catch {}
  }

  const updateRole = async (memberId, role) => {
    try {
      const { data } = await API.put(`/boards/${board._id}/members/${memberId}`, { role })
      onBoardUpdate(data)
    } catch {}
  }

  const removeMember = async (memberId) => {
    if (!confirm('Remove this member?')) return
    try {
      const { data } = await API.delete(`/boards/${board._id}/members/${memberId}`)
      onBoardUpdate(data)
    } catch {}
  }

  return (
    <div className="members-overlay" onClick={onClose}>
      <div className="members-modal" onClick={e => e.stopPropagation()} id="members-modal">
        <div className="members-header">
          <h2>Board Members</h2>
          <button className="members-close" onClick={onClose}>×</button>
        </div>

        <div className="members-body">
          {/* Owner */}
          <div className="member-row">
            <div className="member-avatar owner">{board.owner?.name?.charAt(0)}</div>
            <div className="member-info">
              <span className="member-name">{board.owner?.name}</span>
              <span className="member-email">{board.owner?.email}</span>
            </div>
            <span className="member-role-badge role-admin">Owner</span>
          </div>

          {/* Members */}
          {board.members?.map(m => (
            <div key={m._id} className="member-row">
              <div className="member-avatar">{m.user?.name?.charAt(0)}</div>
              <div className="member-info">
                <span className="member-name">{m.user?.name}</span>
                <span className="member-email">{m.user?.email}</span>
              </div>
              {isAdmin ? (
                <div className="member-actions">
                  <select value={m.role} onChange={e => updateRole(m._id, e.target.value)} className="member-role-select">
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button className="member-remove" onClick={() => removeMember(m._id)}>×</button>
                </div>
              ) : (
                <span className={`member-role-badge role-${m.role}`}>{m.role}</span>
              )}
            </div>
          ))}

          {/* Add member search */}
          {isAdmin && (
            <div className="members-add-section">
              <h3>Add Members</h3>
              <div className="members-add-row">
                <input placeholder="Search by name or email…" value={searchQuery}
                  onChange={e => search(e.target.value)} id="member-search-input" />
                <select value={addRole} onChange={e => setAddRole(e.target.value)} className="member-role-select">
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              {searching && <p className="members-searching">Searching…</p>}
              {searchResults.map(u => (
                <div key={u._id} className="member-row member-search-result">
                  <div className="member-avatar">{u.name?.charAt(0)}</div>
                  <div className="member-info">
                    <span className="member-name">{u.name}</span>
                    <span className="member-email">{u.email}</span>
                  </div>
                  <button className="member-add-btn" onClick={() => addMember(u._id)}>+ Add</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
