export default function Toolbar({
  selectionMode,
  setSelectionMode,
  onExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  return (
    <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-4 flex-shrink-0">

      <span className="text-white font-bold text-base tracking-tight select-none w-24">
        Editify
      </span>

      <div className="w-px h-6 bg-gray-700" />

      <div className="flex items-center gap-1">
        <ToolbarButton onClick={onUndo} disabled={!canUndo} label="Undo" title="Ctrl+Z" />
        <ToolbarButton onClick={onRedo} disabled={!canRedo} label="Redo" title="Ctrl+Y" />
      </div>

      <div className="w-px h-6 bg-gray-700" />

      <SelectionSwitch value={selectionMode} onChange={setSelectionMode} />

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


function SelectionSwitch({ value, onChange }) {
  const options = [
    { id: 'individual', label: 'Individual' },
    { id: 'group',      label: 'Group' },
  ]

  return (
    <div
      className="flex items-center bg-gray-800 rounded-md p-0.5 gap-0.5"
      role="group"
      aria-label="Selection mode"
    >
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors
            ${value === opt.id
              ? 'bg-gray-600 text-white'
              : 'text-gray-400 hover:text-gray-200'
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}