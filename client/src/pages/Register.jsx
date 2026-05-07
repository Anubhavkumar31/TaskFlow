import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const PASSWORD_RULES = [
  { id: 'length',    label: 'At least 8 characters',         test: v => v.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter (A–Z)',     test: v => /[A-Z]/.test(v) },
  { id: 'lowercase', label: 'One lowercase letter (a–z)',     test: v => /[a-z]/.test(v) },
  { id: 'number',    label: 'One number (0–9)',               test: v => /[0-9]/.test(v) },
  { id: 'special',   label: 'One special character (!@#$…)',  test: v => /[^A-Za-z0-9]/.test(v) },
]

function PasswordStrength({ password }) {
  const results = useMemo(
    () => PASSWORD_RULES.map(r => ({ ...r, passed: r.test(password) })),
    [password]
  )
  const passedCount = results.filter(r => r.passed).length

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][passedCount]
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'][passedCount]

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {PASSWORD_RULES.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i < passedCount ? strengthColor : '#e5e7eb',
            }}
          />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color: strengthColor }}>
        {strengthLabel}
      </p>
      <ul className="space-y-1">
        {results.map(rule => (
          <li key={rule.id} className="flex items-center gap-1.5 text-xs">
            <span style={{ color: rule.passed ? '#16a34a' : '#9ca3af' }}>
              {rule.passed ? '✓' : '○'}
            </span>
            <span style={{ color: rule.passed ? '#374151' : '#9ca3af' }}>
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'MEMBER' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordValid = PASSWORD_RULES.every(r => r.test(form.password))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!passwordValid) {
      setError('Please meet all password requirements before continuing.')
      return
    }
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
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                className="input"
                placeholder="Your name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Create a strong password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
              <PasswordStrength password={form.password} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                className="input"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading || !passwordValid}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
