import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

const STYLES = {
  success: 'bg-gray-900 border-green-500 text-white',
  error:   'bg-gray-900 border-red-500 text-white',
  info:    'bg-gray-900 border-indigo-500 text-white',
  warning: 'bg-gray-900 border-yellow-400 text-white',
}

const ICON_STYLES = {
  success: 'bg-green-500 text-white',
  error:   'bg-red-500 text-white',
  info:    'bg-indigo-500 text-white',
  warning: 'bg-yellow-400 text-gray-900',
}

function Toast({ toast, onRemove }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 shadow-2xl min-w-[280px] max-w-[360px] animate-slide-in ${STYLES[toast.type]}`}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${ICON_STYLES[toast.type]}`}>
        {ICONS[toast.type]}
      </div>
      <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-white flex-shrink-0 text-xs ml-1 transition-colors"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    timers.current[id] = setTimeout(() => remove(id), duration)
  }, [remove])

  // Convenience shorthands
  toast.success = (msg, dur) => toast(msg, 'success', dur)
  toast.error   = (msg, dur) => toast(msg, 'error', dur)
  toast.info    = (msg, dur) => toast(msg, 'info', dur)
  toast.warning = (msg, dur) => toast(msg, 'warning', dur)

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container — bottom right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
