import { useState, useRef, useEffect } from 'react'

export default function Toolbar({
  onExport, onUndo, onRedo, canUndo, canRedo,
  onNewUpload, saveStatus, onSaveNow,
}) {
  return (
    <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-4 flex-shrink-0">

      <span className="text-white font-bold text-base tracking-tight select-none">
        Editify
      </span>

      <FileMenu onNewUpload={onNewUpload} />

      <div className="w-px h-6 bg-gray-700" />

      <div className="flex items-center gap-1">
        <ToolbarButton onClick={onUndo} disabled={!canUndo} label="Undo" title="Ctrl+Z" />
        <ToolbarButton onClick={onRedo} disabled={!canRedo} label="Redo" title="Ctrl+Y" />
      </div>

      <div className="w-px h-6 bg-gray-700" />

      <SaveButton status={saveStatus} onSaveNow={onSaveNow} />

      <div className="ml-auto">
        <button
          onClick={onExport}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
        >
          Export PNG
        </button>
      </div>

    </div>
  )
}


function FileMenu({ onNewUpload }) {
  const [open, setOpen] = useState(false)
  const ref             = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-800"
      >
        File
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 opacity-60">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
          <MenuItem
            label="New upload"
            onClick={() => { setOpen(false); onNewUpload?.() }}
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            }
          />
        </div>
      )}
    </div>
  )
}


function MenuItem({ label, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors text-left"
    >
      {icon}
      {label}
    </button>
  )
}


function SaveButton({ status, onSaveNow }) {
  const config = {
    unsaved: { label: 'Unsaved changes', color: 'text-yellow-400', spin: false },
    saving:  { label: 'Saving...',       color: 'text-blue-400',   spin: true  },
    saved:   { label: 'Saved ✓',         color: 'text-green-400',  spin: false },
    error:   { label: 'Save failed',     color: 'text-red-400',    spin: false },
  }
  const { label, color, spin } = config[status] ?? config.saved

  return (
    <button
      onClick={onSaveNow}
      title="Save now"
      className={`flex items-center gap-1.5 text-xs ${color} hover:opacity-80 transition-opacity`}
    >
      {spin && (
        <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      )}
      {label}
    </button>
  )
}


function ToolbarButton({ onClick, disabled, label, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-1 rounded text-sm transition-colors
        ${disabled
          ? 'text-gray-600 cursor-not-allowed'
          : 'text-gray-300 hover:text-white hover:bg-gray-800'
        }`}
    >
      {label}
    </button>
  )
}