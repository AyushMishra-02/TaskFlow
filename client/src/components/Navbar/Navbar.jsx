import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  if (!user) return null

  const initials = user.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <nav className="navbar" id="main-navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-logo">📋</span>
        <span className="navbar-title">TaskFlow</span>
      </Link>
      <div className="navbar-right">
        <Link to="/" className="navbar-link">Boards</Link>
        <div className="navbar-user">
          <div className="navbar-avatar" title={user.name}>{initials}</div>
          <span className="navbar-name">{user.name}</span>
          <button className="navbar-logout" onClick={handleLogout} id="logout-btn">Logout</button>
        </div>
      </div>
    </nav>
  )
}
