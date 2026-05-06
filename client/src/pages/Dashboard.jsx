import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'

const isOverdue = (task) =>
  task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

const formatDate = (d) => {
  const date = new Date(d)
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const STATUS_COLORS = {
  TODO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING_CONFIRMATION: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700',
}
const STATUS_LABELS = { TODO: 'Todo', IN_PROGRESS: 'In Progress', PENDING_CONFIRMATION: 'Pending', DONE: 'Done' }

const PROJECT_STATUS_CONFIG = {
  ACTIVE:    { label: 'Active',    color: 'bg-blue-100 text-blue-700'     },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700'   },
  ON_HOLD:   { label: 'On Hold',   color: 'bg-yellow-100 text-yellow-700' },
}

const TaskRow = ({ task }) => {
  const overdue = isOverdue(task)
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{task.project?.name}</p>
      </div>
      <div className="ml-4 flex items-center gap-2 flex-shrink-0">
        {task.dueDate && (
          <span className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
            {overdue ? '⚠ ' : '📅 '}{formatDate(task.dueDate)}
          </span>
        )}
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>
          {STATUS_LABELS[task.status]}
        </span>
      </div>
    </div>
  )
}

const StatCard = ({ label, value, color, icon }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-1">
      <p className="text-sm text-gray-500">{label}</p>
      <span className="text-lg">{icon}</span>
    </div>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
  </div>
)

const SectionCard = ({ title, tasks, emptyText }) => (
  <div className="card">
    <div className="p-5 border-b border-gray-100">
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </div>
    {tasks.length === 0 ? (
      <div className="p-6 text-center text-sm text-gray-400">{emptyText}</div>
    ) : (
      <div className="divide-y divide-gray-50">
        {tasks.map(task => <TaskRow key={task.id} task={task} />)}
      </div>
    )}
  </div>
)

// Admin dashboard
function AdminDashboard({ stats, onConfirm, onReject }) {
  const [openMembersProjectId, setOpenMembersProjectId] = useState(null)

  const toggleMembers = (id) => setOpenMembersProjectId(prev => prev === id ? null : id)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total tasks" value={stats.total} color="text-gray-900" icon="📋" />
        <StatCard label="Done" value={stats.done} color="text-green-600" icon="✅" />
        <StatCard label="In progress" value={stats.inProgress} color="text-blue-600" icon="🔄" />
        <StatCard label="Overdue" value={stats.overdue} color="text-red-600" icon="⚠️" />
      </div>

      {/* Per-project table */}
      {stats.projectStats?.length > 0 && (
        <div className="card">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Projects overview</h3>
            <p className="text-xs text-gray-400 mt-0.5">Task breakdown across all your projects</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Project</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">Status</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">Members</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">Total</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">To do</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">In progress</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">Pending</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">Done</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">Progress</th>
                </tr>
              </thead>
              <tbody>
                {stats.projectStats.map((proj) => {
                  const pct = proj.total > 0 ? Math.round((proj.done / proj.total) * 100) : 0
                  const statusCfg = PROJECT_STATUS_CONFIG[proj.completionStatus] || PROJECT_STATUS_CONFIG.ACTIVE
                  const isOpen = openMembersProjectId === proj.id
                  return (
                    <>
                      <tr key={proj.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900 max-w-[160px] truncate">{proj.name}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => toggleMembers(proj.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            {proj.members.length} member{proj.members.length !== 1 ? 's' : ''}
                            <span className="text-gray-400">{isOpen ? '▲' : '▾'}</span>
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center font-semibold text-gray-700">{proj.total}</td>
                        <td className="px-3 py-3 text-center text-gray-500">{proj.todo}</td>
                        <td className="px-3 py-3 text-center text-blue-600 font-medium">{proj.inProgress}</td>
                        <td className="px-3 py-3 text-center text-yellow-600 font-medium">{proj.pending}</td>
                        <td className="px-3 py-3 text-center text-green-600 font-medium">{proj.done}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-8">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                      {isOpen && proj.members.length > 0 && (
                        <tr key={proj.id + '-members'} className="bg-indigo-50 border-b border-indigo-100">
                          <td colSpan={9} className="px-8 py-3">
                            <div className="flex flex-wrap gap-3">
                              {proj.members.map((m) => (
                                <div key={m.id} className="flex items-center gap-2 bg-white border border-indigo-100 rounded-lg px-3 py-2 shadow-sm">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {m.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-800">{m.name}</p>
                                    <p className="text-xs text-gray-400">{m.email}</p>
                                  </div>
                                  <span className="ml-2 text-xs bg-indigo-50 text-indigo-600 font-medium px-1.5 py-0.5 rounded">
                                    {m.taskCount} task{m.taskCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              ))}
                              {proj.members.length === 0 && (
                                <p className="text-xs text-gray-400">No members added yet.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.pendingConfirmationTasks?.length > 0 && (
        <div className="card border border-yellow-200">
          <div className="p-5 border-b border-yellow-100 flex items-center gap-2">
            <span>⏳</span>
            <h3 className="font-semibold text-yellow-800">Awaiting your confirmation</h3>
            <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
              {stats.pendingConfirmationTasks.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.pendingConfirmationTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 hover:bg-yellow-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {task.project?.name}{task.assignee ? ` · ${task.assignee.name} marked this done` : ''}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onConfirm(task.id)}
                    className="text-xs bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg px-3 py-1.5 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => onReject(task.id)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-lg px-3 py-1.5 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent tasks</h3>
        </div>
        {stats.recentTasks?.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No tasks yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats.recentTasks?.map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{task.project?.name} {task.assignee ? `· ${task.assignee.name}` : '· Unassigned'}</p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  {task.dueDate && (
                    <span className="text-xs text-gray-400">Due {new Date(task.dueDate).toLocaleDateString()}</span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Member dashboard
function MemberDashboard({ data }) {
  const { stats, urgentTasks, activeTasks, upcomingTasks, pendingTasks } = data

  const progressPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  // Build per-project breakdown from all task lists
  const allMyTasks = [...(urgentTasks ?? []), ...(activeTasks ?? []), ...(upcomingTasks ?? []), ...(pendingTasks ?? [])]
  const seenTaskIds = new Set()
  const projectMap = {}
  allMyTasks.forEach(task => {
    if (seenTaskIds.has(task.id)) return
    seenTaskIds.add(task.id)
    const pid = task.project?.id
    if (!pid) return
    if (!projectMap[pid]) {
      projectMap[pid] = {
        name: task.project.name,
        completionStatus: task.project.completionStatus || 'ACTIVE',
        total: 0, inProgress: 0, done: 0, pending: 0, todo: 0,
      }
    }
    projectMap[pid].total++
    if (task.status === 'IN_PROGRESS') projectMap[pid].inProgress++
    else if (task.status === 'DONE') projectMap[pid].done++
    else if (task.status === 'PENDING_CONFIRMATION') projectMap[pid].pending++
    else if (task.status === 'TODO') projectMap[pid].todo++
  })
  const projectRows = Object.values(projectMap)

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My tasks" value={stats.total} color="text-gray-900" icon="📋" />
        <StatCard label="In progress" value={stats.inProgress} color="text-blue-600" icon="🔄" />
        <StatCard label="Awaiting confirm" value={stats.pending ?? 0} color="text-yellow-600" icon="⏳" />
        <StatCard label="Done" value={stats.done} color="text-green-600" icon="✅" />
      </div>

      {/* Overall progress bar */}
      {stats.total > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Overall progress</p>
            <p className="text-sm font-bold text-indigo-600">{progressPct}%</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{stats.done} of {stats.total} tasks completed</p>
        </div>
      )}

      {/* Per-project breakdown */}
      {projectRows.length > 0 && (
        <div className="card">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">My projects</h3>
            <p className="text-xs text-gray-400 mt-0.5">Task breakdown across your projects</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Project</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">Status</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">Total</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">To do</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">In progress</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">Pending</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">Done</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projectRows.map((proj, i) => {
                  const projPct = proj.total > 0 ? Math.round((proj.done / proj.total) * 100) : 0
                  const statusCfg = PROJECT_STATUS_CONFIG[proj.completionStatus] || PROJECT_STATUS_CONFIG.ACTIVE
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[160px]">{proj.name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[80px]">
                            <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${projPct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{projPct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-gray-700">{proj.total}</td>
                      <td className="px-3 py-3 text-center text-gray-500">{proj.todo}</td>
                      <td className="px-3 py-3 text-center text-blue-600 font-medium">{proj.inProgress}</td>
                      <td className="px-3 py-3 text-center text-yellow-600 font-medium">{proj.pending}</td>
                      <td className="px-3 py-3 text-center text-green-600 font-medium">{proj.done}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Urgent / overdue */}
      {urgentTasks.length > 0 && (
        <div className="card border border-red-100">
          <div className="p-5 border-b border-red-100 flex items-center gap-2">
            <span>⚠️</span>
            <h3 className="font-semibold text-red-700">Needs attention</h3>
            <span className="text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full ml-auto">{urgentTasks.length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {urgentTasks.map(task => <TaskRow key={task.id} task={task} />)}
          </div>
        </div>
      )}

      {/* Pending confirmation tasks */}
      {pendingTasks?.length > 0 && (
        <div className="card border border-yellow-200">
          <div className="p-5 border-b border-yellow-100 flex items-center gap-2">
            <span>⏳</span>
            <h3 className="font-semibold text-yellow-800">Waiting for admin confirmation</h3>
            <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">{pendingTasks.length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{task.project?.name}</p>
                </div>
                <span className="ml-4 text-xs bg-yellow-100 text-yellow-700 font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active + Upcoming side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="🔄 In progress"
          tasks={activeTasks}
          emptyText="No tasks in progress right now."
        />
        <SectionCard
          title="📌 Up next"
          tasks={upcomingTasks}
          emptyText="No upcoming tasks. You're all caught up!"
        />
      </div>

      {stats.total === 0 && (
        <div className="card p-10 text-center text-gray-400">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-medium text-gray-600">No tasks assigned yet</p>
          <p className="text-sm mt-1">Once a project admin assigns tasks to you, they'll appear here.</p>
        </div>
      )}
    </div>
  )
}

// Main export
export default function Dashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  )

  const handleConfirm = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: 'DONE' })
      setData(prev => ({
        ...prev,
        pendingConfirmationTasks: prev.pendingConfirmationTasks.filter(t => t.id !== taskId),
        done: prev.done + 1,
      }))
      toast.success('Task confirmed as done!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm task')
    }
  }

  const handleReject = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: 'IN_PROGRESS' })
      setData(prev => ({
        ...prev,
        pendingConfirmationTasks: prev.pendingConfirmationTasks.filter(t => t.id !== taskId),
        inProgress: prev.inProgress + 1,
      }))
      toast.info('Task sent back to In Progress')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject task')
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name} 👋</h2>
        <p className="text-gray-500 mt-1">
          {data?.isMember ? "Here's what's on your plate." : "Here's what's happening across your projects."}
        </p>
      </div>
      {data?.isMember
        ? <MemberDashboard data={data} />
        : <AdminDashboard stats={data} onConfirm={handleConfirm} onReject={handleReject} />
      }
    </div>
  )
}
