// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'
// import api from '../api/axios'
// import { useToast } from '../context/ToastContext'

// const STATUS_CONFIG = {
//   ACTIVE:    { label: 'Active',    color: 'bg-blue-100 text-blue-700'     },
//   COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700'   },
//   ON_HOLD:   { label: 'On Hold',   color: 'bg-yellow-100 text-yellow-700' },
// }

// function CompletionBadge({ status }) {
//   const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE
//   return (
//     <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
//       {status === 'COMPLETED' && <span className="mr-1">✓</span>}
//       {cfg.label}
//     </span>
//   )
// }

// function CompletionEditor({ project, onUpdated }) {
//   const toast = useToast()
//   const [open, setOpen] = useState(false)
//   const [status, setStatus] = useState(project.completionStatus || 'ACTIVE')
//   const [completedAt, setCompletedAt] = useState(
//     project.completedAt ? project.completedAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
//   )
//   const [saving, setSaving] = useState(false)

//   const handleSave = async () => {
//     setSaving(true)
//     try {
//       const payload = {
//         completionStatus: status,
//         completedAt: status === 'COMPLETED' ? new Date(completedAt).toISOString() : null,
//       }
//       const res = await api.patch(`/projects/${project.id}/completion`, payload)
//       onUpdated(res.data)
//       toast.success('Project status updated!')
//       setOpen(false)
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Failed to update status')
//     } finally {
//       setSaving(false)
//     }
//   }

//   return (
//     <div className="mt-3">
//       {!open ? (
//         <button
//           onClick={() => setOpen(true)}
//           className="text-xs text-gray-400 hover:text-indigo-600 underline underline-offset-2 transition-colors"
//         >
//           Update status
//         </button>
//       ) : (
//         <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
//           <div>
//             <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
//             <select
//               className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               value={status}
//               onChange={e => setStatus(e.target.value)}
//             >
//               <option value="ACTIVE">Active</option>
//               <option value="ON_HOLD">On Hold</option>
//               <option value="COMPLETED">Completed</option>
//             </select>
//           </div>
//           {status === 'COMPLETED' && (
//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">Completion date</label>
//               <input
//                 type="date"
//                 className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 value={completedAt}
//                 onChange={e => setCompletedAt(e.target.value)}
//               />
//             </div>
//           )}
//           <div className="flex gap-2 pt-1">
//             <button
//               onClick={handleSave}
//               disabled={saving}
//               className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-md py-1.5 font-medium transition-colors disabled:opacity-60"
//             >
//               {saving ? 'Saving…' : 'Save'}
//             </button>
//             <button
//               onClick={() => { setOpen(false); setStatus(project.completionStatus || 'ACTIVE') }}
//               className="flex-1 text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-md py-1.5 font-medium transition-colors"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default function Projects() {
//   const { user, isAdmin } = useAuth()
//   const toast = useToast()
//   const [projects, setProjects] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [showForm, setShowForm] = useState(false)
//   const [form, setForm] = useState({ name: '', description: '' })
//   const [error, setError] = useState('')
//   const [creating, setCreating] = useState(false)

//   const fetchProjects = () => {
//     api.get('/projects')
//       .then(res => setProjects(res.data))
//       .catch(console.error)
//       .finally(() => setLoading(false))
//   }

//   useEffect(() => { fetchProjects() }, [])

//   const handleCreate = async (e) => {
//     e.preventDefault()
//     setError('')
//     setCreating(true)
//     try {
//       await api.post('/projects', form)
//       setForm({ name: '', description: '' })
//       setShowForm(false)
//       fetchProjects()
//       toast.success('Project created!')
//     } catch (err) {
//       const msg = err.response?.data?.message || 'Failed to create project'
//       setError(msg)
//       toast.error(msg)
//     } finally {
//       setCreating(false)
//     }
//   }

//   const handleDelete = async (id) => {
//     if (!confirm('Delete this project and all its tasks?')) return
//     try {
//       await api.delete(`/projects/${id}`)
//       setProjects(projects.filter(p => p.id !== id))
//       toast.success('Project deleted')
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Failed to delete')
//     }
//   }

//   const handleCompletionUpdated = (updated) => {
//     setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
//   }

//   if (loading) return (
//     <div className="flex items-center justify-center h-64">
//       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
//     </div>
//   )

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-8">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
//           <p className="text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
//         </div>
//         {isAdmin && (
//           <button onClick={() => setShowForm(!showForm)} className="btn-primary">
//             + New project
//           </button>
//         )}
//       </div>

//       {showForm && (
//         <div className="card p-6 mb-6">
//           <h3 className="font-semibold text-gray-900 mb-4">Create new project</h3>
//           {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
//           <form onSubmit={handleCreate} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
//               <input type="text" className="input" placeholder="e.g. Website Redesign" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
//               <textarea className="input" rows="2" placeholder="Brief project description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
//             </div>
//             <div className="flex gap-3">
//               <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create project'}</button>
//               <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
//             </div>
//           </form>
//         </div>
//       )}

//       {projects.length === 0 ? (
//         <div className="card p-12 text-center text-gray-400">
//           {isAdmin ? 'No projects yet. Create your first project above.' : "You haven't been added to any projects yet."}
//         </div>
//       ) : (
//         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//           {projects.map(project => {
//             const isProjectAdmin = isAdmin && project.adminId === user?.id
//             const status = project.completionStatus || 'ACTIVE'

//             return (
//               <div
//                 key={project.id}
//                 className={`card p-5 hover:shadow-md transition-shadow ${
//                   status === 'COMPLETED' ? 'border border-green-200' :
//                   status === 'ON_HOLD'   ? 'border border-yellow-200' : ''
//                 }`}
//               >
//                 {/* Header */}
//                 <div className="flex items-start justify-between mb-2">
//                   <Link
//                     to={`/projects/${project.id}`}
//                     className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors leading-snug pr-2"
//                   >
//                     {project.name}
//                   </Link>
//                   {isProjectAdmin && (
//                     <button onClick={() => handleDelete(project.id)} className="text-gray-300 hover:text-red-500 text-xs ml-2 flex-shrink-0">✕</button>
//                   )}
//                 </div>

//                 {/* Status badge + completion date */}
//                 <div className="flex items-center gap-2 mb-2">
//                   <CompletionBadge status={status} />
//                   {status === 'COMPLETED' && project.completedAt && (
//                     <span className="text-xs text-gray-400">
//                       {new Date(project.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
//                     </span>
//                   )}
//                 </div>

//                 {project.description && (
//                   <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>
//                 )}

//                 <div className="flex items-center justify-between text-xs text-gray-400">
//                   <span>{project.members?.length ?? 0} member{project.members?.length !== 1 ? 's' : ''}</span>
//                   <span>{project._count?.tasks ?? 0} task{project._count?.tasks !== 1 ? 's' : ''}</span>
//                 </div>

//                 {/* Admin-only status editor */}
//                 {isProjectAdmin && (
//                   <CompletionEditor
//                     project={{ ...project, completionStatus: status }}
//                     onUpdated={handleCompletionUpdated}
//                   />
//                 )}

//                 <Link to={`/projects/${project.id}`} className="mt-3 block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium">
//                   View project →
//                 </Link>
//               </div>
//             )
//           })}
//         </div>
//       )}
//     </div>
//   )
// }


import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'

const STATUS_CONFIG = {
  ACTIVE:    { label: 'Active',    color: 'bg-blue-100 text-blue-700'     },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700'   },
  ON_HOLD:   { label: 'On Hold',   color: 'bg-yellow-100 text-yellow-700' },
}

function CompletionBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {status === 'COMPLETED' && <span className="mr-1">✓</span>}
      {cfg.label}
    </span>
  )
}

function CompletionEditor({ project, onUpdated }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(project.completionStatus || 'ACTIVE')
  const [completedAt, setCompletedAt] = useState(
    project.completedAt ? project.completedAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        completionStatus: status,
        completedAt: status === 'COMPLETED' ? new Date(completedAt).toISOString() : null,
      }
      const res = await api.patch(`/projects/${project.id}/completion`, payload)
      onUpdated(res.data)
      toast.success('Project status updated!')
      setOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-gray-400 hover:text-indigo-600 underline underline-offset-2 transition-colors"
        >
          Update status
        </button>
      ) : (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          {status === 'COMPLETED' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Completion date</label>
              <input
                type="date"
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={completedAt}
                onChange={e => setCompletedAt(e.target.value)}
              />
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-md py-1.5 font-medium transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setOpen(false); setStatus(project.completionStatus || 'ACTIVE') }}
              className="flex-1 text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-md py-1.5 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Projects() {
  const { user, isAdmin } = useAuth()
  const toast = useToast()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'

  const fetchProjects = () => {
    api.get('/projects')
      .then(res => setProjects(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      await api.post('/projects', form)
      setForm({ name: '', description: '' })
      setShowForm(false)
      fetchProjects()
      toast.success('Project created!')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create project'
      setError(msg)
      toast.error(msg)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return
    try {
      await api.delete(`/projects/${id}`)
      setProjects(projects.filter(p => p.id !== id))
      toast.success('Project deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  const handleCompletionUpdated = (updated) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle - exactly like in ProjectDetail */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="1" width="4" height="4" rx="1" />
                <rect x="6" y="1" width="4" height="4" rx="1" />
                <rect x="11" y="1" width="4" height="4" rx="1" />
                <rect x="1" y="6" width="4" height="4" rx="1" />
                <rect x="6" y="6" width="4" height="4" rx="1" />
                <rect x="11" y="6" width="4" height="4" rx="1" />
                <rect x="1" y="11" width="4" height="4" rx="1" />
                <rect x="6" y="11" width="4" height="4" rx="1" />
                <rect x="11" y="11" width="4" height="4" rx="1" />
              </svg>
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
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
          {isAdmin && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              + New project
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Create new project</h3>
          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
              <input type="text" className="input" placeholder="e.g. Website Redesign" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea className="input" rows="2" placeholder="Brief project description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create project'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          {isAdmin ? 'No projects yet. Create your first project above.' : "You haven't been added to any projects yet."}
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map(project => {
                const isProjectAdmin = isAdmin && project.adminId === user?.id
                const status = project.completionStatus || 'ACTIVE'

                return (
                  <div
                    key={project.id}
                    className={`card p-5 hover:shadow-md transition-shadow ${
                      status === 'COMPLETED' ? 'border border-green-200' :
                      status === 'ON_HOLD'   ? 'border border-yellow-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Link
                        to={`/projects/${project.id}`}
                        className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors leading-snug pr-2"
                      >
                        {project.name}
                      </Link>
                      {isProjectAdmin && (
                        <button onClick={() => handleDelete(project.id)} className="text-gray-300 hover:text-red-500 text-xs ml-2 flex-shrink-0">✕</button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <CompletionBadge status={status} />
                      {status === 'COMPLETED' && project.completedAt && (
                        <span className="text-xs text-gray-400">
                          {new Date(project.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {project.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{project.members?.length ?? 0} member{project.members?.length !== 1 ? 's' : ''}</span>
                      <span>{project._count?.tasks ?? 0} task{project._count?.tasks !== 1 ? 's' : ''}</span>
                    </div>

                    {isProjectAdmin && (
                      <CompletionEditor
                        project={{ ...project, completionStatus: status }}
                        onUpdated={handleCompletionUpdated}
                      />
                    )}

                    <Link to={`/projects/${project.id}`} className="mt-3 block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                      View project →
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Project</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Description</th>
                      <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Members</th>
                      <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Tasks</th>
                      {isAdmin && <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {projects.map(project => {
                      const isProjectAdmin = isAdmin && project.adminId === user?.id
                      const status = project.completionStatus || 'ACTIVE'
                      const statusCfg = STATUS_CONFIG[status]

                      return (
                        <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3">
                            <Link
                              to={`/projects/${project.id}`}
                              className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                            >
                              {project.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                              {status === 'COMPLETED' && <span className="mr-1">✓</span>}
                              {statusCfg.label}
                            </span>
                            {status === 'COMPLETED' && project.completedAt && (
                              <span className="text-xs text-gray-400 ml-2">
                                {new Date(project.completedAt).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-500 line-clamp-2 max-w-xs">
                              {project.description || <span className="italic text-gray-300">No description</span>}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-gray-500">
                            {project.members?.length ?? 0}
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-gray-500">
                            {project._count?.tasks ?? 0}
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-center">
                              {isProjectAdmin && (
                                <button
                                  onClick={() => handleDelete(project.id)}
                                  className="text-gray-300 hover:text-red-500 text-xs"
                                  title="Delete project"
                                >
                                  ✕
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}