import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'

const STATUSES = ['TODO', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'DONE']
const STATUS_LABELS = {
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  PENDING_CONFIRMATION: 'Pending Confirmation',   // admin label
  DONE: 'Marked as completed'
}
const STATUS_COLORS = {
  TODO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING_CONFIRMATION: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700',
}

// Statuses a member can select — they cannot set DONE directly
const MEMBER_SELECTABLE_STATUSES = ['TODO', 'IN_PROGRESS', 'PENDING_CONFIRMATION']
const MEMBER_STATUS_LABELS = {
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  PENDING_CONFIRMATION: '✓ Mark as complete'
}

const isOverdue = (task) =>
  task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const toast = useToast()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('board')
  const [viewMode, setViewMode] = useState('board')

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '', assigneeId: '' })
  const [taskError, setTaskError] = useState('')
  const [creatingTask, setCreatingTask] = useState(false)

  const [showMemberForm, setShowMemberForm] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberError, setMemberError] = useState('')
  const [addingMember, setAddingMember] = useState(false)

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`)
      setProject(res.data)
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProject() }, [id])

  const handleCreateTask = async (e) => {
    e.preventDefault()
    setTaskError('')
    setCreatingTask(true)
    try {
      await api.post(`/tasks/project/${id}`, {
        ...taskForm,
        dueDate: taskForm.dueDate || null,
        assigneeId: taskForm.assigneeId || null,
      })
      setTaskForm({ title: '', description: '', dueDate: '', assigneeId: '' })
      setShowTaskForm(false)
      fetchProject()
      toast.success('Task created!')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create task'
      setTaskError(msg)
      toast.error(msg)
    } finally {
      setCreatingTask(false)
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus })
      setProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus, completedAt: newStatus === 'DONE' ? new Date().toISOString() : null } : t)
      }))
      const statusMessages = {
        DONE: '✅ Task marked as completed!',
        PENDING_CONFIRMATION: '⏳ Marked as complete — waiting for admin confirmation',
        IN_PROGRESS: '🔄 Task moved to In Progress',
        TODO: '📌 Task moved back to Todo',
      }
      toast.success(statusMessages[newStatus] || 'Status updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleAssigneeChange = async (taskId, newAssigneeId) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { assigneeId: newAssigneeId || null })
      setProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, assignee: res.data.assignee, assigneeId: res.data.assigneeId } : t)
      }))
      if (newAssigneeId) {
        const member = project.members.find(m => m.user.id === newAssigneeId)
        toast.success(`Assigned to ${member?.user?.name || 'member'}`)
      } else {
        toast.info('Task unassigned')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update assignee')
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${taskId}`)
      setProject(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }))
      toast.success('Task deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task')
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setMemberError('')
    setAddingMember(true)
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail })
      setMemberEmail('')
      setShowMemberForm(false)
      fetchProject()
      toast.success('Member added to project!')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add member'
      setMemberError(msg)
      toast.error(msg)
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the project?')) return
    try {
      await api.delete(`/projects/${id}/members/${userId}`)
      fetchProject()
      toast.success('Member removed from project')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
  if (!project) return null

  const isProjectAdmin = project.adminId === user?.id
  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = project.tasks.filter(t => t.status === s)
    return acc
  }, {})

  // Helper to determine what status control to show for a task (Board view)
  const renderStatusControl = (task) => {
    const isTaskAssignee = task.assignee?.id === user?.id
    const canChangeStatus = isProjectAdmin || isTaskAssignee

    if (!canChangeStatus) {
      // Read‑only badge for non‑assignees / non‑admin
      return <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[task.status]}`}>{STATUS_LABELS[task.status]}</span>
    }

    if (isProjectAdmin) {
      // Admin sees full status selector (including DONE) + confirm/reject for PENDING_CONFIRMATION
      if (task.status === 'PENDING_CONFIRMATION') {
        return (
          <div className="flex gap-1.5">
            <button onClick={() => handleStatusChange(task.id, 'DONE')} className="text-xs bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg px-2 py-1 transition-colors">✓ Confirm</button>
            <button onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-lg px-2 py-1 transition-colors">↩ Reject</button>
          </div>
        )
      }
      return (
        <select
          value={task.status}
          onChange={e => handleStatusChange(task.id, e.target.value)}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
        >
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      )
    }

    // Member (non‑admin) view
    if (task.status === 'DONE') {
      // Admin already marked as completed – member sees read‑only badge with "Marked as completed"
      return <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS.DONE}`}>{STATUS_LABELS.DONE}</span>
    }

    if (task.status === 'PENDING_CONFIRMATION') {
      // Member sees "Awaiting admin confirmation" badge (read‑only)
      return (
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
          ⏳ Awaiting admin confirmation
        </span>
      )
    }

    // Member sees selector for TODO / IN_PROGRESS (can move to PENDING_CONFIRMATION)
    return (
      <select
        value={task.status}
        onChange={e => handleStatusChange(task.id, e.target.value)}
        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
      >
        {MEMBER_SELECTABLE_STATUSES.map(s => (
          <option key={s} value={s}>{MEMBER_STATUS_LABELS[s]}</option>
        ))}
      </select>
    )
  }

  // For table column (simpler, inline version)
  const renderTableStatusCell = (task) => {
    const isTaskAssignee = task.assignee?.id === user?.id
    const canChangeStatus = isProjectAdmin || isTaskAssignee

    if (!canChangeStatus) {
      return <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[task.status]}`}>{STATUS_LABELS[task.status]}</span>
    }

    if (isProjectAdmin) {
      if (task.status === 'PENDING_CONFIRMATION') {
        return (
          <div className="flex gap-1.5">
            <button onClick={() => handleStatusChange(task.id, 'DONE')} className="text-xs bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg px-2 py-1">✓ Confirm</button>
            <button onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-lg px-2 py-1">↩ Reject</button>
          </div>
        )
      }
      return (
        <select
          value={task.status}
          onChange={e => handleStatusChange(task.id, e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
        >
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      )
    }

    if (task.status === 'DONE') {
      return <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS.DONE}`}>{STATUS_LABELS.DONE}</span>
    }

    if (task.status === 'PENDING_CONFIRMATION') {
      return (
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
          ⏳ Awaiting admin confirmation
        </span>
      )
    }

    return (
      <select
        value={task.status}
        onChange={e => handleStatusChange(task.id, e.target.value)}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
      >
        {MEMBER_SELECTABLE_STATUSES.map(s => (
          <option key={s} value={s}>{MEMBER_STATUS_LABELS[s]}</option>
        ))}
      </select>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate('/projects')} className="text-sm text-gray-400 hover:text-gray-600 mb-3">← Back to projects</button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
            <p className="text-xs text-gray-400 mt-1">Admin: {project.admin?.name}</p>
          </div>
          {isProjectAdmin && (
            <button onClick={() => setShowTaskForm(!showTaskForm)} className="btn-primary">+ Add task</button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 border-b border-gray-100">
        <div className="flex gap-1">
          {['board', 'members'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab} {tab === 'members' && `(${project.members.length})`}
            </button>
          ))}
        </div>
        {activeTab === 'board' && (
          <div className="flex items-center gap-1 mb-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'board' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="1" width="4" height="14" rx="1" />
                <rect x="6" y="1" width="4" height="14" rx="1" />
                <rect x="11" y="1" width="4" height="14" rx="1" />
              </svg>
              Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="1" width="14" height="14" rx="1" />
                <line x1="1" y1="5" x2="15" y2="5" />
                <line x1="1" y1="9" x2="15" y2="9" />
                <line x1="1" y1="13" x2="15" y2="13" />
                <line x1="5" y1="1" x2="5" y2="15" />
              </svg>
              Table
            </button>
          </div>
        )}
      </div>

      {showTaskForm && isProjectAdmin && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">New task</h3>
          {taskError && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{taskError}</div>}
          <form onSubmit={handleCreateTask} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" className="input" placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input" rows="2" placeholder="Optional description..." value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
              <input type="date" className="input" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
              <select className="input" value={taskForm.assigneeId} onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                <option value="">Unassigned</option>
                {project.members.map(m => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary" disabled={creatingTask}>{creatingTask ? 'Creating...' : 'Create task'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowTaskForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'board' && viewMode === 'table' && (
        <div className="card overflow-hidden">
          {project.tasks.length === 0 ? (
            <div className="p-12 text-center text-gray-300 text-sm">No tasks yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3 w-2/5">Task</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Assignee</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Due Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Completed</th>
                  {isProjectAdmin && <th className="px-4 py-3 w-10"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {project.tasks.map(task => (
                  <tr key={task.id} className={`hover:bg-gray-50 transition-colors ${isOverdue(task) ? 'bg-red-50/30' : ''}`}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      {task.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {isProjectAdmin ? (
                        <select
                          value={task.assignee?.id || ''}
                          onChange={e => handleAssigneeChange(task.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-600 max-w-[160px]"
                        >
                          <option value="">👤 Unassigned</option>
                          {project.members.map(m => (
                            <option key={m.user.id} value={m.user.id}>👤 {m.user.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {task.assignee ? `👤 ${task.assignee.name}` : <span className="italic text-gray-300">Unassigned</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {renderTableStatusCell(task)}
                    </td>
                    <td className="px-4 py-3">
                      {task.dueDate ? (
                        <span className={`text-xs ${isOverdue(task) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                          📅 {new Date(task.dueDate).toLocaleDateString()}{isOverdue(task) && ' · Overdue'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {task.completedAt ? (
                        <span className="text-xs text-green-600 font-medium">
                          ✓ {new Date(task.completedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    {isProjectAdmin && (
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteTask(task.id)} className="text-gray-200 hover:text-red-400 text-xs">✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'board' && viewMode === 'board' && (
        <div className="grid grid-cols-3 gap-4">
          {STATUSES.map(status => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                <span className="text-xs text-gray-400">{tasksByStatus[status].length}</span>
              </div>
              <div className="space-y-3">
                {tasksByStatus[status].length === 0 && (
                  <div className="border-2 border-dashed border-gray-100 rounded-xl p-4 text-center text-xs text-gray-300">No tasks</div>
                )}
                {tasksByStatus[status].map(task => (
                  <div key={task.id} className={`card p-4 ${isOverdue(task) ? 'border-red-200' : ''}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
                      {isProjectAdmin && (
                        <button onClick={() => handleDeleteTask(task.id)} className="text-gray-200 hover:text-red-400 flex-shrink-0 text-xs">✕</button>
                      )}
                    </div>
                    {task.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>}

                    {isProjectAdmin ? (
                      <div className="mb-2">
                        <select
                          value={task.assignee?.id || ''}
                          onChange={e => handleAssigneeChange(task.id, e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-600"
                        >
                          <option value="">👤 Unassigned</option>
                          {project.members.map(m => (
                            <option key={m.user.id} value={m.user.id}>👤 {m.user.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : task.assignee ? (
                      <p className="text-xs text-gray-400 mb-2">👤 {task.assignee.name}</p>
                    ) : (
                      <p className="text-xs text-gray-300 mb-2 italic">Unassigned</p>
                    )}

                    {task.dueDate && (
                      <p className={`text-xs mb-3 ${isOverdue(task) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        📅 {new Date(task.dueDate).toLocaleDateString()} {isOverdue(task) && '· Overdue'}
                      </p>
                    )}

                    {renderStatusControl(task)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="max-w-lg">
          {isProjectAdmin && (
            <div className="mb-4">
              {!showMemberForm ? (
                <button onClick={() => setShowMemberForm(true)} className="btn-primary">+ Add member</button>
              ) : (
                <div className="card p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Add member by email</h3>
                  {memberError && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{memberError}</div>}
                  <form onSubmit={handleAddMember} className="flex gap-3">
                    <input type="email" className="input flex-1" placeholder="member@example.com" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required />
                    <button type="submit" className="btn-primary" disabled={addingMember}>{addingMember ? 'Adding...' : 'Add'}</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowMemberForm(false)}>Cancel</button>
                  </form>
                </div>
              )}
            </div>
          )}
          <div className="card divide-y divide-gray-50">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                  {project.admin?.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{project.admin?.name}</p>
                  <p className="text-xs text-gray-400">{project.admin?.email}</p>
                </div>
              </div>
              <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full">Admin</span>
            </div>
            {project.members.map(m => (
              <div key={m.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">
                    {m.user.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                    <p className="text-xs text-gray-400">{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{m.user.role}</span>
                  {isProjectAdmin && (
                    <button onClick={() => handleRemoveMember(m.user.id)} className="text-xs text-gray-300 hover:text-red-500">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}