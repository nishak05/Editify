import { useState, useEffect } from 'react'

export default function PropertiesPanel({ selected, fabricRef, onDelete, onPropertyChange }) {
  const [props, setProps] = useState(null)

  useEffect(() => {
    if (!selected) { setProps(null); return }
    setProps(readProps(selected))
  }, [selected])

  useEffect(() => {
    if (!fabricRef?.current) return
    const canvas = fabricRef.current

    const onModified = () => { if (selected) setProps(readProps(selected)) }

    canvas.on('object:modified', onModified)
    canvas.on('object:moving',   onModified)
    canvas.on('object:scaling',  onModified)

    return () => {
      canvas.off('object:modified', onModified)
      canvas.off('object:moving',   onModified)
      canvas.off('object:scaling',  onModified)
    }
  }, [selected, fabricRef])

  const handleOpacity = (val) => {
    if (!selected || !fabricRef?.current) return
    selected.set('opacity', val / 100)
    fabricRef.current.renderAll()
    setProps(prev => ({ ...prev, opacity: val }))
    onPropertyChange?.()
  }

  if (!props) return <EmptyState />

  const isGroup = selected?.type === 'activeSelection'

  return (
    <div className="w-56 bg-gray-900 border-l border-gray-800 flex flex-col flex-shrink-0 overflow-hidden">

      <div className="px-4 py-3 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Properties
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">

        <Section>
          <Field label="Name">{props.label}</Field>
          <Field label="Type">
            <span className={`text-xs px-1.5 py-0.5 rounded
              ${props.type === 'text'
                ? 'bg-blue-900 text-blue-300'
                : 'bg-emerald-900 text-emerald-300'}`}>
              {isGroup ? 'group' : props.type}
            </span>
          </Field>
        </Section>

        <Divider />

        <Section title="Position">
          <div className="grid grid-cols-2 gap-2">
            <NumField label="X" value={props.x} />
            <NumField label="Y" value={props.y} />
          </div>
        </Section>

        <Divider />

        <Section title="Size">
          <div className="grid grid-cols-2 gap-2">
            <NumField label="W" value={props.w} />
            <NumField label="H" value={props.h} />
          </div>
        </Section>

        <Divider />

        <Section title="Opacity">
          <div className="flex items-center gap-3">
            <input
              type="range" min={0} max={100} value={props.opacity}
              onChange={e => handleOpacity(Number(e.target.value))}
              className="flex-1 accent-blue-500"
            />
            <span className="text-xs text-gray-400 w-8 text-right">{props.opacity}%</span>
          </div>
        </Section>

        <Divider />

        <Section>
          <button
            onClick={onDelete}
            className="w-full py-2 bg-red-900 hover:bg-red-800 text-red-200 text-sm rounded-md transition-colors"
          >
            Delete {isGroup ? 'group' : 'element'}
          </button>
        </Section>

      </div>
    </div>
  )
}


function EmptyState() {
  return (
    <div className="w-56 bg-gray-900 border-l border-gray-800 flex flex-col flex-shrink-0">
      <div className="px-4 py-3 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Properties
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xs text-gray-600 text-center px-4">
          Select an element<br />to see its properties
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="px-4 py-3">
      {title && <p className="text-xs text-gray-500 mb-2">{title}</p>}
      {children}
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-gray-800 mx-4" />
}

function Field({ label, children }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-300 truncate max-w-[120px] text-right">{children}</span>
    </div>
  )
}

function NumField({ label, value }) {
  return (
    <div className="bg-gray-800 rounded px-2 py-1.5">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-xs text-gray-200 font-mono">{value}</p>
    </div>
  )
}


function readProps(obj) {
  if (!obj) return null
  const bounds = obj.getBoundingRect()
  const data   = obj.data ?? obj._objects?.[0]?.data ?? {}
  return {
    label:   data.label || data.type || 'Element',
    type:    data.type  || 'object',
    x:       Math.round(bounds.left),
    y:       Math.round(bounds.top),
    w:       Math.round(bounds.width),
    h:       Math.round(bounds.height),
    opacity: Math.round((obj.opacity ?? 1) * 100),
  }
}