import { useState, useRef, useEffect } from 'react'

export default function Toolbar({
  onExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onNewUpload,
  onOpenLibrary,
  saveStatus,
  onSaveNow,
}) {
  return (
    <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-4 flex-shrink-0">

      <span className="
          text-3xl
          font-extrabold
          tracking-tight
          bg-gradient-to-r
          from-cyan-400
          via-blue-500
          to-purple-500
          bg-clip-text
          text-transparent
          "
        >
        Editify
      </span>

      <FileMenu
          onNewUpload={onNewUpload}
          onOpenLibrary={onOpenLibrary}
          onSave={onExport}
      />

      <div className="w-px h-6 bg-gray-700" />

      <div className="flex items-center gap-1">
        <ToolbarButton onClick={onUndo} disabled={!canUndo} label="Undo" title="Ctrl+Z" />
        <ToolbarButton onClick={onRedo} disabled={!canRedo} label="Redo" title="Ctrl+Y" />
      </div>

      <div className="w-px h-7 bg-white/10" />

      <SaveButton status={saveStatus} onSaveNow={onSaveNow} />

      <div className="ml-auto">
        <button
          onClick={onExport}
          className="
            flex items-center gap-2
            px-5 py-2.5
            rounded-xl
            text-sm font-medium
            bg-gradient-to-r
            from-blue-600
            to-purple-600
            text-white
            shadow-lg shadow-purple-500/20
            hover:shadow-purple-500/35
            hover:scale-[1.02]
            transition-all duration-200
            "
        >
          Export
        </button>
      </div>

    </div>
  )
}


function FileMenu({ onNewUpload, onOpenLibrary, onSave }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target))
        setOpen(false)
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>

      <button
        onClick={() => setOpen(v => !v)}
        className="
          flex items-center gap-1.5
          px-3 py-2
          rounded-lg
          text-md
          text-gray-300
          hover:text-white
          hover:bg-white/5
          transition-all
        "
      >
        File

        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">

          <MenuItem
            label="New Upload"
            onClick={()=>{
              setOpen(false)
              onNewUpload?.()
            }}
          />

          <MenuItem
            label="Library"
            onClick={() => {
              setOpen(false)
              onOpenLibrary?.()
            }}
          />

          <div className="my-1 border-t border-gray-700" />

          <MenuItem
            label="Save"
            onClick={()=>{
              setOpen(false)
              onSave?.()
            }}
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
      className={`flex items-center gap-1.5 text-sm font-medium ${color} hover:opacity-80 transition-opacity`}
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
      className={`px-3 py-2 rounded text-sm transition-colors
        ${disabled
          ? 'text-gray-600 cursor-not-allowed'
          : 'text-gray-300 hover:text-white hover:bg-gray-800'
        }`}
    >
      {label}
    </button>
  )
}