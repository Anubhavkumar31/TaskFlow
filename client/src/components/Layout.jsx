import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        location.pathname === to || location.pathname.startsWith(to + '/')
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full">
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-indigo-600">TaskFlow</h1>
          <p className="text-xs text-gray-400 mt-0.5">Team Task Manager</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navLink('/dashboard', '📊 Dashboard')}
          {navLink('/projects', '📁 Projects')}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className={`text-xs font-medium ${isAdmin ? 'text-indigo-500' : 'text-gray-400'}`}>
                {user?.role}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full text-left text-sm text-gray-500 hover:text-red-500 transition-colors">
            Sign out
          </button>
        </div>
      </aside>
      <main className="ml-60 flex-1 p-8">{children}</main>
    </div>
  )
}
