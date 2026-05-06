import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'MEMBER' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-600">TaskFlow</h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>
        <div className="card p-8">
          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" className="input" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" className="input" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
